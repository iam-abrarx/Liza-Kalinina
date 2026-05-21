import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_BIO = {
  text: "Born in the United States and holding American citizenship, I was raised between the US and Egypt. I began my career in cinematography at the age of 23, working as a Director of Photography on commercial productions across the Middle East. My early work included campaigns for major international and regional brands such as Nestlé Maggi and Thndr in Saudi Arabia, allowing me to develop a strong visual style shaped by both large-scale productions and fast-paced international sets.\n\nI trained under acclaimed cinematographer Roman Vasyanov, serving as his assistant on numerous major productions and feature films, and also taking on second unit cinematography for commercial campaigns. Most recently, I shot a commercial project for Verizon. Among the feature productions I contributed to was Limonov: The Ballad, directed by Kirill Serebrennikov. Working alongside internationally recognized filmmakers gave me extensive experience on high-level film sets and further refined my cinematic approach.\n\nDriven by a passion for visual storytelling and exploration, I have also worked in documentary filmmaking, shooting projects across diverse environments worldwide, including underwater cinematography.\n\nAlongside commercial and documentary work, I shot my first feature film, Foreign Call (2026), as Director of Photography, further establishing my work in narrative cinema. I hold a degree in Cinematography from the Cinema and Television Institute, as well as a Master’s degree in Directing and Screenwriting from ESRA in Paris.",
  images: [
    "/bio/43c254a5-1e62-472a-9e2c-3f5466129c5d.jpg",
    "/bio/c0e8a659-1fe4-4eb9-b88c-00fcb558cde6.jpg",
    "/bio/077f6fa7-abad-4498-bef0-2684f4980c64.jpg"
  ]
};

export async function GET() {
  try {
    const bio = await prisma.bio.findFirst();
    if (!bio) {
      return NextResponse.json({
        text: DEFAULT_BIO.text,
        images: DEFAULT_BIO.images
      });
    }
    return NextResponse.json(bio);
  } catch (error) {
    console.error("Failed to fetch bio:", error);
    return NextResponse.json({ error: "Failed to fetch bio" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    const correctPassword = process.env.ADMIN_PASSWORD;
    if (!correctPassword || adminPassword !== correctPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, images } = body;

    if (text === undefined || text === null) {
      return NextResponse.json({ error: 'Bio text is required' }, { status: 400 });
    }

    const bio = await prisma.bio.upsert({
      where: { id: 'singleton' },
      update: {
        text,
        images: images || []
      },
      create: {
        id: 'singleton',
        text,
        images: images || []
      }
    });

    return NextResponse.json(bio);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Failed to update bio:", error);
    return NextResponse.json({ error: 'Failed to update bio', details: errorMessage }, { status: 500 });
  }
}
