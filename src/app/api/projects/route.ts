import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';



export async function GET(request: Request) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    const isAdmin = adminPassword === (process.env.ADMIN_PASSWORD || 'admin');
    
    const projects = await prisma.project.findMany({
      orderBy: { sort_order: 'asc' }
    });
    
    if (isAdmin) {
      return NextResponse.json(projects);
    }

    const sanitizedProjects = projects.map(p => {
      if (!p.is_public && p.media_url && !p.media_url.includes('vimeo.com')) {
        return {
          ...p,
          media_url: '',
          long_description: '',
          is_locked: true,
        };
      }
      return p;
    });

    return NextResponse.json(sanitizedProjects);
  } catch (error) {
    console.error("Fetch Projects Error:", error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== (process.env.ADMIN_PASSWORD || 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const project = await prisma.project.create({
      data: {
        title: body.title,
        category: body.category as any,
        year: body.year,
        media_url: body.media_url,
        thumbnail_url: body.thumbnail_url,
        role: body.role,
        director: body.director,
        client: body.client,
        production_company: body.production_company,
        awards: body.awards,
        description: body.description,
        long_description: body.long_description,
        gallery: body.gallery || [],
        is_public: body.category !== 'FEATURED',
        sort_order: body.sort_order || 0,
      }
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
