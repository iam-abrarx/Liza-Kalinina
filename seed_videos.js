const { PrismaClient } = require("@prisma/client");
const { put } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");

// Load env vars manually
const envFile = fs.readFileSync(path.join(__dirname, ".env"), "utf-8");
envFile.split("\n").forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
});

const prisma = new PrismaClient();

const VIDEO_DIR = "D:/Liza_DOP/assets/videos";

// Map video filenames to categories based on their content
const VIDEO_CONFIG = [
  { file: "80 Meters Under Ice Documentary.mp4", title: "80 Meters Under Ice Documentary", category: "DOCUMENTARY" },
  { file: "Desert rider.mov", title: "Desert Rider", category: "DOCUMENTARY" },
  { file: "Enterprise Intelligence _ Private 5G Network from Verizon Business.mp4", title: "Enterprise Intelligence - Private 5G Network from Verizon Business", category: "COMMERCIAL" },
  { file: "Maggi Nestle commercial .MP4", title: "Maggi Nestle Commercial", category: "COMMERCIAL" },
  { file: "Maggi- Nestle commerical.MP4", title: "Maggi - Nestle Commercial (BTS)", category: "COMMERCIAL" },
  { file: "Sirotkin Music Clip.mp4", title: "Sirotkin Music Clip", category: "MUSIC_VIDEO" },
  { file: "Thunder Saudi Arabia commercial .mov", title: "Thunder Saudi Arabia Commercial", category: "COMMERCIAL" },
  { file: "veterinary_clinic_commercial (2160p).mp4", title: "Veterinary Clinic Commercial", category: "COMMERCIAL" },
  { file: "Карантинная Комната.mp4", title: "Quarantine Room (Карантинная Комната)", category: "NARRATIVE" },
];

// Vimeo projects to add
const VIMEO_PROJECTS = [
  {
    title: "Commander Islands Far East Expedition",
    category: "DOCUMENTARY",
    media_url: "https://vimeo.com/1141071612",
    thumbnail_url: "https://i.vimeocdn.com/video/2068975366-d63f30b7d8d58ac3a7e3ecf49e89f2ed29300d0363c7fb5af29bdf6987e6e866",
    year: "2025",
    role: "Director of Photography",
    director: "Liza Kalinina",
    description: "Commander Islands — a far east expedition documentary.",
  },
  {
    title: "Directors Showreel Elizabeth Kalinin 2025",
    category: "COMMERCIAL",
    media_url: "https://vimeo.com/1057449640",
    thumbnail_url: "https://i.vimeocdn.com/video/2012791995-a5e1c48b71cc59fce3bde0e1c8f56acde72bd44d50cf1af78d8b24e2a0e53695",
    year: "2025",
    role: "Director of Photography",
    director: "Liza Kalinina",
    description: "A compilation showreel showcasing Director of Photography work.",
  },
];

const MAX_SIZE_MB = 90; // Skip files larger than 90MB (Vercel Blob limit considerations)

async function main() {
  console.log("🎬 Starting video upload and database seeding...\n");

  let sortOrder = 100; // Start at 100 so Vimeo projects can be at the top

  // 1. Upload direct video files
  for (const config of VIDEO_CONFIG) {
    const filePath = path.join(VIDEO_DIR, config.file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${config.file} — skipping`);
      continue;
    }

    const stats = fs.statSync(filePath);
    const sizeMB = Math.round(stats.size / 1024 / 1024);

    if (sizeMB > MAX_SIZE_MB) {
      console.log(`⏭️  Skipping "${config.file}" (${sizeMB}MB > ${MAX_SIZE_MB}MB limit)`);
      continue;
    }

    console.log(`📤 Uploading "${config.file}" (${sizeMB}MB)...`);

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = await put(`videos/${Date.now()}-${config.file}`, fileBuffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      console.log(`   ✅ Uploaded to: ${blob.url.substring(0, 60)}...`);

      // Create DB entry
      await prisma.project.create({
        data: {
          title: config.title,
          category: config.category,
          year: "2026",
          media_url: blob.url,
          thumbnail_url: "",
          role: "Director of Photography",
          director: "Liza Kalinina",
          client: "",
          production_company: "",
          awards: "",
          description: config.title,
          long_description: "",
          gallery: [],
          sort_order: sortOrder++,
          is_public: true,
        },
      });

      console.log(`   📝 DB entry created: "${config.title}" [${config.category}]\n`);
    } catch (err) {
      console.error(`   ❌ Error uploading "${config.file}":`, err.message);
    }
  }

  // 2. Create Vimeo projects (no upload needed)
  console.log("\n🎥 Adding Vimeo projects...\n");
  for (const vimeo of VIMEO_PROJECTS) {
    try {
      await prisma.project.create({
        data: {
          ...vimeo,
          client: "",
          production_company: "",
          awards: "",
          long_description: "",
          gallery: [],
          sort_order: sortOrder++,
          is_public: true,
        },
      });
      console.log(`   ✅ Created: "${vimeo.title}" (Vimeo) [${vimeo.category}]`);
    } catch (err) {
      console.error(`   ❌ Error creating Vimeo project:`, err.message);
    }
  }

  console.log("\n🎉 Done! All projects seeded.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
