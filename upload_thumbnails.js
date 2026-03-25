const { put } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");

const TOKEN = "vercel_blob_rw_tcQdtZgwrA1uLnvR_KxtF0PrqtQE2045EOxjLj3u81oRKoY";
const UPLOAD_DIR = "d:/Liza_DOP/portfolio/public/uploads";

async function uploadThumbnails() {
  const files = fs.readdirSync(UPLOAD_DIR);
  const images = files.filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f));
  
  console.log(`Found ${images.length} images to upload.`);
  
  const results = [];
  for (const file of images) {
    console.log(`Uploading ${file}...`);
    const buffer = fs.readFileSync(path.join(UPLOAD_DIR, file));
    const blob = await put(file, buffer, {
      access: 'public',
      token: TOKEN
    });
    console.log(`✅ ${file} -> ${blob.url}`);
    results.push({ file, url: blob.url });
  }
  
  fs.writeFileSync('uploaded_thumbnails.json', JSON.stringify(results, null, 2));
  console.log('Done! Saved to uploaded_thumbnails.json');
}

uploadThumbnails().catch(console.error);
