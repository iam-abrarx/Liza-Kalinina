import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';



export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminPassword = request.headers.get('x-admin-password');
  
  if (adminPassword !== (process.env.ADMIN_PASSWORD || 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`[API] Attempting to delete project: ${id}`);
  
  try {
    const deleted = await prisma.project.delete({
      where: { id }
    });
    console.log(`[API] Successfully deleted project: ${id}`);
    return NextResponse.json({ message: 'Project deleted', id: deleted.id });
  } catch (error: any) {
    console.error(`[API] Delete Error for project ${id}:`, error);
    
    // Check for specific Prisma errors (e.g., P2025: Record not found)
    if (error.code === 'P2025') {
       return NextResponse.json({ error: 'Project not found in database. It might be local dummy data.' }, { status: 404 });
    }
    
    return NextResponse.json({ error: `Failed to delete project: ${error.message}` }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminPassword = request.headers.get('x-admin-password');

    if (adminPassword !== (process.env.ADMIN_PASSWORD || 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        is_public: body.category !== 'FEATURED',
        sort_order: body.sort_order,
      }
    });
    
    return NextResponse.json(project);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
