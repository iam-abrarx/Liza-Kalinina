const fs = require('fs');
const path = require('path');

// Load env
fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[match[1].trim()] = val;
  }
});

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const projects = await db.project.findMany();

  for (const p of projects) {
    const title = p.title.toLowerCase();
    let updates = {};

    // Fix: "Desert Rider" is a documentary, not FEATURED
    if (title.includes('desert rider') && p.category === 'FEATURED') {
      updates = { category: 'DOCUMENTARY', is_public: true };
      console.log(`FIX: "${p.title}" FEATURED -> DOCUMENTARY`);
    }

    // Fix: "Enterprise Intelligence _ Private 5G Network" — clean title
    if (title.includes('enterprise intelligence _')) {
      updates = { ...updates, title: 'Enterprise Intelligence - Private 5G Network' };
      console.log(`FIX: "${p.title}" -> cleaned title`);
    }

    // Fix: "Directors Showreel Elizabeth Kalinin 2025" should be FEATURED (it's a showreel, not a commercial)
    if (title.includes('directors showreel elizabeth') && p.category === 'COMMERCIAL') {
      updates = { ...updates, category: 'FEATURED', is_public: false };
      console.log(`FIX: "${p.title}" COMMERCIAL -> FEATURED`);
    }

    // Fix: "Sirotkin" title — make it fuller
    if (title === 'sirotkin') {
      updates = { ...updates, title: 'Sirotkin Music Clip' };
      console.log(`FIX: "${p.title}" -> "Sirotkin Music Clip"`);
    }

    // Fix: "Карантинная Комната" — ensure proper title
    if (title.includes('карантинная')) {
      updates = { ...updates, title: 'Quarantine Room (Карантинная Комната)' };
      console.log(`FIX: "${p.title}" -> clean title`);
    }

    if (Object.keys(updates).length > 0) {
      await db.project.update({ where: { id: p.id }, data: updates });
    }
  }

  console.log('\n=== POST-FIX AUDIT ===');
  const fixed = await db.project.findMany({ orderBy: { sort_order: 'asc' } });
  fixed.forEach((p, i) => {
    console.log(`${i+1}. [${p.category}] "${p.title}" | public=${p.is_public}`);
  });

  const cats = {};
  fixed.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
  console.log('\nCATEGORY COUNTS:');
  Object.keys(cats).sort().forEach(c => console.log(`  ${c}: ${cats[c]}`));

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
