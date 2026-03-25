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
    year: "2024",
    media_url: "https://liza-portfolio.vercel.app/uploads/80_meters_under_ice.mov",
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
    year: "2023",
    media_url: "https://liza-portfolio.vercel.app/uploads/Desert_rider.mov",
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
    year: "2023",
    media_url: "https://liza-portfolio.vercel.app/uploads/Verizon_Business.mp4",
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
    year: "2023",
    media_url: "https://liza-portfolio.vercel.app/uploads/Maggi_Nestle.MP4",
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
    year: "2024",
    media_url: "https://liza-portfolio.vercel.app/uploads/Sirotkin_Music.mp4",
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
    year: "2023",
    media_url: "https://liza-portfolio.vercel.app/uploads/Thunder_Saudi_Arabia.mov",
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
    year: "2023",
    media_url: "https://liza-portfolio.vercel.app/uploads/vet_clinic.mp4",
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
    year: "2024",
    media_url: "https://liza-portfolio.vercel.app/uploads/Quarantine_Room.mov",
    role: "Director of Photography",
    director: "Liza Kalinina",
    client: "Narrative",
    production_company: "Independent",
    description: "Narrative short film: Quarantine Room.",
    sort_order: 11
  }
];

const BASE_URL = process.argv[2]; // e.g. https://portfolio-v2.vercel.app
const ADMIN_PASSWORD = process.argv[3] || 'admin';

if (!BASE_URL) {
  console.error("Please provide the Vercel base URL as the first argument.");
  console.error("Usage: node seed_remote.js https://your-site.vercel.app [admin_password]");
  process.exit(1);
}

async function seed() {
  console.log(`Starting remote seed for: ${BASE_URL}`);
  
  for (const project of projects) {
    try {
      const res = await fetch(`${BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD
        },
        body: JSON.stringify(project)
      });
      
      if (res.ok) {
        console.log(`✅ Created: ${project.title}`);
        const data = await res.json();
        
        if (project.category === 'FEATURED') {
          const passRes = await fetch(`${BASE_URL}/api/ticket-passes`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-admin-password': ADMIN_PASSWORD
            },
            body: JSON.stringify({
              pass_code: "showreel2026",
              linked_project_id: data.id
            })
          });
          if (passRes.ok) console.log(`   🎟️ Created pass for: ${project.title}`);
        }
      } else {
        const error = await res.text();
        console.error(`❌ Failed: ${project.title} - ${res.status} ${error}`);
      }
    } catch (err) {
      console.error(`💥 Error seeding ${project.title}:`, err.message);
    }
  }
  
  console.log("Remote seeding complete.");
}

seed();
