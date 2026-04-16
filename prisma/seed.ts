import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ASSETS_PATH = 'D:/Liza_DOP/assets/videos'

const missingProjects = [
  {
    title: 'Directors Showreel Elizabeth Kalinina 2025',
    category: 'COMMERCIAL' as const,
    year: '2025',
    media_url: `${ASSETS_PATH}/directors_showreel_elizabeth_kalinin_2025 (1080p).mp4`,
    role: 'Director of Photography',
    is_public: true,
    sort_order: 0,
  },
  {
    title: 'Thunder Saudi Arabia',
    category: 'COMMERCIAL' as const,
    year: '2026',
    media_url: `${ASSETS_PATH}/Thunder Saudi Arabia- commercial .mov`,
    role: 'Director of Photography',
    client: 'Thunder Saudi Arabia',
    is_public: true,
    sort_order: 0,
  },
]

async function main() {
  console.log('Seeding missing projects...\n')

  for (const project of missingProjects) {
    // Check if a project with the same title already exists
    const existing = await prisma.project.findFirst({
      where: { title: project.title }
    })

    if (existing) {
      console.log(`⏭  Skipped (already exists): ${project.title}`)
      continue
    }

    const created = await prisma.project.create({ data: project })
    console.log(`✅ Created: ${created.title} [${created.category}]`)
  }

  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
