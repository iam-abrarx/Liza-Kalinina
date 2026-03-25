const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

const projects = [
  {
    title: "Showreel 2026",
    category: "FEATURED",
    year: "2026",
    media_url: "https://vimeo.com/1132272734",
    role: "Director of Photography",
    director: "Liza Kalinina",
    client: "Personal",
    production_company: "Liza Kalinina",
    description: "Personal showreel featuring the latest works from 2026.",
    long_description: "A compilation of cinematography highlights from commercials, music videos, and narrative projects. Password protected for exclusive screening.",
    sort_order: 1
  },
  {
    title: "Commercial Work 2025",
    category: "COMMERCIAL",
    year: "2025",
    media_url: "https://vimeo.com/1141071612",
    role: "Director of Photography",
    director: "Various",
    client: "Various",
    production_company: "Various",
    description: "Featured commercial work from 2025.",
    sort_order: 2
  },
  {
    title: "Narrative Project 2024",
    category: "NARRATIVE",
    year: "2024",
    media_url: "https://vimeo.com/1057449640",
    role: "Director of Photography",
    director: "Various",
    client: "Various",
    production_company: "Various",
    description: "Featured narrative work from 2024.",
    sort_order: 3
  },
  {
    title: "80 Meters Under Ice",
    category: "DOCUMENTARY",
    media_search: "80 Meters Under Ice",
    year: "2024",
    role: "Director of Photography",
    director: "Liza Kalinina",
    client: "Documentary",
    production_company: "Independent",
    description: "Documentary exploring the depths of 80 meters under the ice.",
    sort_order: 4
  },
  {
    title: "Desert Rider",
    category: "COMMERCIAL",
    media_search: "Desert rider",
    year: "2023",
    role: "Director of Photography",
    director: "Various",
    client: "Automotive",
    production_company: "Various",
    description: "High-octane commercial featuring a desert rider.",
    sort_order: 5
  },
  {
    title: "Verizon Business",
    category: "COMMERCIAL",
    media_search: "Verizon Business",
    year: "2023",
    role: "Director of Photography",
    director: "Various",
    client: "Verizon",
    production_company: "Various",
    description: "Enterprise Intelligence commercial for Verizon Business.",
    sort_order: 6
  },
  {
    title: "Maggi Nestle Commercial",
    category: "COMMERCIAL",
    media_search: "Maggi Nestle",
    year: "2023",
    role: "Director of Photography",
    director: "Various",
    client: "Nestle",
    production_company: "Various",
    description: "Commercial for Maggi Nestle.",
    sort_order: 7
  },
  {
    title: "Sirotkin Music Clip",
    category: "MUSIC_VIDEO",
    media_search: "Sirotkin Music Clip",
    year: "2024",
    role: "Director of Photography",
    director: "Various",
    client: "Sirotkin",
    production_company: "Various",
    description: "Music video for Sirotkin.",
    sort_order: 8
  },
  {
    title: "Thunder Saudi Arabia",
    category: "COMMERCIAL",
    media_search: "Thunder Saudi Arabia",
    year: "2023",
    role: "Director of Photography",
    director: "Various",
    client: "Various",
    production_company: "Various",
    description: "Commercial for Thunder Saudi Arabia.",
    sort_order: 9
  },
  {
    title: "Veterinary Clinic Commercial",
    category: "COMMERCIAL",
    media_search: "vet_clinic",
    year: "2023",
    role: "Director of Photography",
    director: "Various",
    client: "Various",
    production_company: "Various",
    description: "Commercial for a veterinary clinic.",
    sort_order: 10
  },
  {
    title: "Quarantine Room",
    category: "NARRATIVE",
    media_search: "Карантинная",
    year: "2024",
    role: "Director of Photography",
    director: "Liza Kalinina",
    client: "Narrative",
    production_company: "Independent",
    description: "Narrative short film: Quarantine Room.",
    sort_order: 11
  }
];

async function seed() {
  const blobs = JSON.parse(fs.readFileSync('blobs.json', 'utf8'));
  
  console.log('Clearing old records...');
  await prisma.ticketPass.deleteMany();
  await prisma.project.deleteMany();

  for (const p of projects) {
    let finalUrl = p.media_url;
    
    if (!finalUrl && p.media_search) {
      const match = blobs.find(b => 
        b.pathname.toLowerCase().includes(p.media_search.toLowerCase()) ||
        decodeURIComponent(b.url).toLowerCase().includes(p.media_search.toLowerCase())
      );
      if (match) {
        finalUrl = match.url;
        console.log(`🔗 Matched Blob for ${p.title}: ${finalUrl}`);
      } else {
        console.warn(`⚠️ No Blob found for ${p.title}, using placeholder.`);
        finalUrl = "/placeholder.mp4";
      }
    }

    const project = await prisma.project.create({
      data: {
        title: p.title,
        category: p.category,
        year: p.year,
        media_url: finalUrl,
        role: p.role,
        director: p.director,
        client: p.client,
        production_company: p.production_company,
        description: p.description,
        long_description: p.long_description || "",
        sort_order: p.sort_order,
        is_public: p.category !== 'FEATURED'
      }
    });

    if (p.category === 'FEATURED') {
      await prisma.ticketPass.create({
        data: {
          pass_code: "showreel2026",
          linked_project_id: project.id
        }
      });
      console.log(`🎟️ Created pass for ${p.title}`);
    }
  }

  console.log('✅ Seeding complete!');
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
