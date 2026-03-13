import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';



export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.project.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Project deleted' });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const project = await prisma.project.update({
      where: { id },
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
        gallery: body.gallery,
        is_public: body.category !== 'PREMIERE',
        sort_order: body.sort_order,
      }
    });
    
    return NextResponse.json(project);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
