const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing existing records...')
  await prisma.ticketPass.deleteMany()
  await prisma.project.deleteMany()

  const liveProjects = [
    {
      title: "Sirotkin Music Clip",
      category: "MUSIC_VIDEO",
      year: "2024",
      media_url: "/uploads/Sirotkin Music Clip.mp4",
      role: "Director of Photography",
      director: "Various",
      client: "Sirotkin",
      production_company: "Independent",
      description: "Music Video for Sirotkin.",
      sort_order: 1
    },
    {
      title: "Desert Rider",
      category: "COMMERCIAL",
      year: "2023",
      media_url: "/uploads/Desert rider.mov",
      role: "Director of Photography",
      director: "Various",
      client: "Automotive Brand",
      production_company: "Production House",
      description: "Automotive commercial in the desert.",
      sort_order: 2
    },
    {
      title: "Veterinary Clinic",
      category: "COMMERCIAL",
      year: "2023",
      media_url: "/uploads/veterinary_clinic_commercial (2160p).mp4",
      role: "Director of Photography",
      director: "Various",
      client: "Vet Clinic",
      production_company: "Production House",
      description: "Veterinary clinic promotional video.",
      sort_order: 3
    },
    {
      title: "Verizon Business - Private 5G",
      category: "COMMERCIAL",
      year: "2023",
      media_url: "/uploads/Enterprise Intelligence _ Private 5G Network from Verizon Business.mp4",
      role: "Director of Photography",
      director: "Various",
      client: "Verizon Business",
      production_company: "Verizon",
      description: "Enterprise Intelligence Private 5G Network commercial.",
      sort_order: 4
    },
    {
      title: "Thunder Saudi Arabia",
      category: "COMMERCIAL",
      year: "2023",
      media_url: "/uploads/Thunder Saudi Arabia commercial .mov",
      role: "Director of Photography",
      director: "Various",
      client: "Thunder",
      production_company: "Saudi Production",
      description: "Commercial for Thunder Saudi Arabia.",
      sort_order: 5
    },
    {
      title: "Maggi Nestle - Version 1",
      category: "COMMERCIAL",
      year: "2023",
      media_url: "/uploads/Maggi Nestle commerical.MP4",
      role: "Director of Photography",
      director: "Various",
      client: "Nestle",
      production_company: "Maggi",
      description: "Maggi Nestle commercial.",
      sort_order: 6
    },
    {
      title: "Maggi Nestle - Version 2",
      category: "COMMERCIAL",
      year: "2023",
      media_url: "/uploads/Maggi Nestle commercial .MP4",
      role: "Director of Photography",
      director: "Various",
      client: "Nestle",
      production_company: "Maggi",
      description: "Maggi Nestle commercial alternate version.",
      sort_order: 7
    }
  ]

  for (const project of liveProjects) {
    await prisma.project.create({
      data: {
        ...project,
        is_public: true
      }
    })
    console.log(`Created project: ${project.title}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
