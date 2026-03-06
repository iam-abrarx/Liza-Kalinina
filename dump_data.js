
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { sort_order: 'asc' }
  });
  const passes = await prisma.ticketPass.findMany({
    include: { project: true }
  });
  
  const data = {
    projects,
    passes
  };
  
  fs.writeFileSync('dummy_data.json', JSON.stringify(data, null, 2));
  console.log('Data dumped to dummy_data.json');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
