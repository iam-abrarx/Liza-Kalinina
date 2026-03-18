import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(process.cwd(), 'dummy_data.json');
  const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

  console.log('🗑️  Cleaning existing data...');
  await prisma.ticketPass.deleteMany();
  await prisma.project.deleteMany();

  console.log(`🌱 Seeding ${data.projects.length} projects...`);
  
  for (const project of data.projects) {
    // Remove relation and internal fields before seeding
    const { id, createdAt, updatedAt, ...projectData } = project;
    await prisma.project.create({
      data: {
        ...projectData,
        id: id // Keep the same IDs for consistency
      }
    });
  }

  console.log(`🎫 Seeding ${data.passes.length} ticket passes...`);
  for (const pass of data.passes) {
    const { id, project, createdAt, ...passData } = pass;
    await prisma.ticketPass.create({
      data: {
        ...passData,
        id: id
      }
    });
  }

  console.log('✨ Database Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
