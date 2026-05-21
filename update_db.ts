import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.project.updateMany({
    where: { category: 'MUSIC_VIDEO' },
    data: { category: 'COMMERCIAL' }
  });
  console.log(`Updated ${result.count} projects.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
