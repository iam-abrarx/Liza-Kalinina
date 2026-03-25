const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const projects = await prisma.project.findMany({
      select: { title: true, thumbnail_url: true, media_url: true }
    });
    console.log(JSON.stringify(projects, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
