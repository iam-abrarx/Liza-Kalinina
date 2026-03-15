
const projects = [
  {
    title: "Showreel 2026",
    category: "PREMIERE",
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
    category: "NARRATIVE",
    year: "2024",
    media_url: "/uploads/80 meters under ice documentary.mov",
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
    media_url: "/uploads/Desert rider.mov",
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
    media_url: "/uploads/Enterprise Intelligence _ Private 5G Network from Verizon Business.mp4",
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
    media_url: "/uploads/Maggi Nestle commercial .MP4",
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
    media_url: "/uploads/Sirotkin Music Clip.mp4",
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
    media_url: "/uploads/Thunder Saudi Arabia commercial .mov",
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
    media_url: "/uploads/veterinary_clinic_commercial (2160p).mp4",
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
    media_url: "/uploads/Карантинная комната.mov",
    role: "Director of Photography",
    director: "Liza Kalinina",
    client: "Narrative",
    production_company: "Independent",
    description: "Narrative short film: Quarantine Room.",
    sort_order: 11
  }
];

async function seed() {
  for (const project of projects) {
    const res = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    if (res.ok) {
      console.log(`Created project: ${project.title}`);
      const data = await res.json();
      if (project.category === 'PREMIERE') {
        const passRes = await fetch('http://localhost:3000/api/ticket-passes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pass_code: "showreel2026",
            linked_project_id: data.id
          })
        });
        if (passRes.ok) console.log(`Created pass for: ${project.title}`);
      }
    } else {
      console.error(`Failed to create project: ${project.title}`);
    }
  }
}

seed();
