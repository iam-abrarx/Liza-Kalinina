const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const user = await prisma.$queryRaw`SELECT current_user`;
    console.log('Current User:', user);
    
    const tables = await prisma.$queryRaw`SELECT tablename, tableowner FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tables:', tables);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
