import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';

const prisma = new PrismaClient();

// Helper to create a progress tracking stream
function createProgressStream(fileName, totalSize) {
  let uploadedBytes = 0;
  let lastReportedTime = Date.now();
  let lastReportedBytes = 0;

  return new Transform({
    transform(chunk, encoding, callback) {
      uploadedBytes += chunk.length;
      const now = Date.now();
      
      // Report every 500ms or so to avoid flooding the console
      if (now - lastReportedTime > 500) {
        const percent = ((uploadedBytes / totalSize) * 100).toFixed(2);
        const speed = (((uploadedBytes - lastReportedBytes) / (1024 * 1024)) / ((now - lastReportedTime) / 1000)).toFixed(2);
        
        process.stdout.write(`\r  [PROGRESS] ${fileName}: ${percent}% (${(uploadedBytes / (1024 * 1024)).toFixed(2)} / ${(totalSize / (1024 * 1024)).toFixed(2)} MB) - ${speed} MB/s   `);
        
        lastReportedTime = now;
        lastReportedBytes = uploadedBytes;
      }
      callback(null, chunk);
    },
    flush(callback) {
      process.stdout.write(`\r  [PROGRESS] ${fileName}: 100% Complete!                                         \n`);
      callback();
    }
  });
}

async function migrate() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('Error: BLOB_READ_WRITE_TOKEN is not set.');
    process.exit(1);
  }

  const projects = await prisma.project.findMany();
  const totalProjects = projects.length;
  console.log(`\n🚀 Starting Migration of ${totalProjects} Projects to Vercel Blob...`);
  console.log(`📏 Limit: 250MB. Oversized projects will be removed from production.`);

  for (let pIndex = 0; pIndex < totalProjects; pIndex++) {
    const project = projects[pIndex];
    let updatedNeeded = false;
    let newMediaUrl = project.media_url;
    let newGallery = [...project.gallery];

    console.log(`\n[${pIndex + 1}/${totalProjects}] "${project.title}"`);

    // Check media_url
    if (project.media_url?.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', project.media_url);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const fileName = path.basename(filePath);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

          if (stats.size > 250 * 1024 * 1024) {
            console.warn(`\n  🗑️  REMOVING: "${project.title}" since "${fileName}" is ${sizeMB}MB (Exceeds 250MB).`);
            await prisma.project.delete({ where: { id: project.id } });
            continue; // Move to next project
          }
          
          const fileStream = fs.createReadStream(filePath);
          const progressStream = createProgressStream(fileName, stats.size);
          
          const blob = await put(fileName, fileStream.pipe(progressStream), {
            token: token,
            access: 'public',
            contentType: fileName.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4',
            allowOverwrite: true,
          });
          
          newMediaUrl = blob.url;
          updatedNeeded = true;
          console.log(`  ✅ Media URL updated.`);
        } catch (err) {
          console.error(`\n  ❌ Media Upload Error: ${err.message}`);
        }
      }
    }

    // Check gallery
    for (let i = 0; i < newGallery.length; i++) {
        if (newGallery[i].startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), 'public', newGallery[i]);
            if (fs.existsSync(filePath)) {
                try {
                  const stats = fs.statSync(filePath);
                  const fileName = path.basename(filePath);
                  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                  if (stats.size > 250 * 1024 * 1024) {
                    console.warn(`\n  ⚠️  SKIPPING GALLERY: "${fileName}" is ${sizeMB}MB (Exceeds 250MB).`);
                    continue;
                  }
                  
                  const fileStream = fs.createReadStream(filePath);
                  const progressStream = createProgressStream(`Gallery[${i+1}] ${fileName}`, stats.size);

                  const blob = await put(fileName, fileStream.pipe(progressStream), {
                    token: token,
                    access: 'public',
                    contentType: fileName.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4',
                    allowOverwrite: true,
                  });
                  newGallery[i] = blob.url;
                  updatedNeeded = true;
                  console.log(`  ✅ Gallery item updated.`);
                } catch (err) {
                  console.error(`\n  ❌ Gallery Item Error: ${err.message}`);
                }
            }
        }
    }

    if (updatedNeeded) {
      // Check if project still exists (just in case)
      const exists = await prisma.project.findUnique({ where: { id: project.id } });
      if (exists) {
        await prisma.project.update({
          where: { id: project.id },
          data: { media_url: newMediaUrl, gallery: newGallery },
        });
      }
    }
  }

  console.log('\n✨ Asset Migration and Cleanup Finished Successfully!');
}

migrate()
  .catch(err => {
    console.error('\n💥 Critical failure during migration:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
