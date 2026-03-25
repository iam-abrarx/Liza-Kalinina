const { list } = require('@vercel/blob');
const fs = require('fs');

const TOKEN = "vercel_blob_rw_tcQdtZgwrA1uLnvR_KxtF0PrqtQE2045EOxjLj3u81oRKoY";

async function listBlobs() {
  console.log('Fetching blobs...');
  try {
    const { blobs } = await list({
      token: TOKEN
    });
    fs.writeFileSync('blobs.json', JSON.stringify(blobs, null, 2), 'utf8');
    console.log('✅ blobs.json saved (UTF-8)');
  } catch (err) {
    console.error('Error listing blobs:', err.message);
  }
}

listBlobs();
