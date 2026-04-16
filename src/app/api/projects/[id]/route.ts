import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';



export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminPassword = request.headers.get('x-admin-password');
  
  const correctPassword = process.env.ADMIN_PASSWORD;
  if (!correctPassword || adminPassword !== correctPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`[API] Attempting to delete project: ${id}`);
  
  try {
    const deleted = await prisma.project.delete({
      where: { id }
    });
    console.log(`[API] Successfully deleted project: ${id}`);
    return NextResponse.json({ message: 'Project deleted', id: deleted.id });
  } catch (error) {
    console.error(`[API] Delete Error for project ${id}:`, error);
    
    // Check for specific Prisma errors (e.g., P2025: Record not found)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete project', details: errorMessage }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminPassword = request.headers.get('x-admin-password');

    const correctPassword = process.env.ADMIN_PASSWORD;
    if (!correctPassword || adminPassword !== correctPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Reject base64 data URLs for thumbnails (they bloat the database)
    let thumbnailUrl = body.thumbnail_url;
    if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
      console.warn('Rejected base64 thumbnail — too large for database storage');
      thumbnailUrl = null;
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        title: body.title,
        category: body.category,
        year: body.year,
        media_url: body.media_url,
        thumbnail_url: thumbnailUrl,
        role: body.role ?? null,
        director: body.director ?? null,
        client: body.client ?? null,
        production_company: body.production_company ?? null,
        awards: body.awards ?? null,
        description: body.description ?? null,
        long_description: body.long_description ?? null,
        gallery: body.gallery || [],
        is_public: body.category !== 'FEATURED',
        sort_order: body.sort_order ?? 0,
      }
    });
    
    return NextResponse.json(project);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update project', details: errorMessage }, { status: 500 });
  }
}
