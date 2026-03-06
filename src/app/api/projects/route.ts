import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    
    const projects = await prisma.project.findMany({
      where: isAdmin ? {} : { is_public: true },
      orderBy: { sort_order: 'asc' }
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const project = await prisma.project.create({
      data: {
        title: body.title,
        category: body.category as any,
        year: body.year,
        media_url: body.media_url,
        role: body.role,
        director: body.director,
        client: body.client,
        production_company: body.production_company,
        awards: body.awards,
        description: body.description,
        long_description: body.long_description,
        gallery: body.gallery || [],
        is_public: body.category !== 'PREMIERE',
        sort_order: body.sort_order || 0,
      }
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
