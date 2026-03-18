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
  const projects = await db.project.findMany({ orderBy: { sort_order: 'asc' } });
  
  let output = `TOTAL: ${projects.length} projects\n\n`;

  projects.forEach((p, i) => {
    const urlType = p.media_url.startsWith('http') ? 'REMOTE' : 'LOCAL';
    output += `${i+1}. [${p.category}] "${p.title}" | url=${urlType} | public=${p.is_public} | thumb=${p.thumbnail_url ? 'yes' : 'no'}\n`;
  });

  output += '\nCATEGORY COUNTS:\n';
  const cats = {};
  projects.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
  Object.keys(cats).sort().forEach(c => { output += `  ${c}: ${cats[c]}\n`; });

  fs.writeFileSync('audit_result.txt', output);
  console.log(output);
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
