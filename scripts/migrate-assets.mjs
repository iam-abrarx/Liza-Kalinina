import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function migrate() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('Error: BLOB_READ_WRITE_TOKEN is not set in environment variables.');
    process.exit(1);
  }

  const projects = await prisma.project.findMany();
  console.log(`Found ${projects.length} projects to check.`);

  for (const project of projects) {
    let updatedNeeded = false;
    let newMediaUrl = project.media_url;
    let newGallery = [...project.gallery];

    // Check media_url
    if (project.media_url?.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', project.media_url);
      try {
        console.log(`Uploading media for project "${project.title}": ${project.media_url}`);
        const fileBuffer = await fs.readFile(filePath);
        const fileName = path.basename(filePath);
        const blob = await put(fileName, fileBuffer, {
          access: 'public',
          token: token,
        });
        newMediaUrl = blob.url;
        updatedNeeded = true;
        console.log(`Successfully uploaded. New URL: ${newMediaUrl}`);
      } catch (err) {
        console.error(`Failed to upload ${project.media_url}:`, err.message);
      }
    }

    // Check gallery
    for (let i = 0; i < newGallery.length; i++) {
        if (newGallery[i].startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), 'public', newGallery[i]);
            try {
              console.log(`Uploading gallery item for project "${project.title}": ${newGallery[i]}`);
              const fileBuffer = await fs.readFile(filePath);
              const fileName = path.basename(filePath);
              const blob = await put(fileName, fileBuffer, {
                access: 'public',
                token: token,
              });
              newGallery[i] = blob.url;
              updatedNeeded = true;
              console.log(`Successfully uploaded. New URL: ${newGallery[i]}`);
            } catch (err) {
              console.error(`Failed to upload ${newGallery[i]}:`, err.message);
            }
        }
    }

    if (updatedNeeded) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          media_url: newMediaUrl,
          gallery: newGallery,
        },
      });
      console.log(`Updated database record for project: ${project.title}`);
    }
  }

  console.log('Migration complete!');
}

migrate()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
