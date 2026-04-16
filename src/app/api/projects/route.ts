import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';



export async function GET(request: Request) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    const isAdmin = adminPassword === (process.env.ADMIN_PASSWORD || 'adminpass123321');
    
    // Fetch all projects
    const allProjects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Manually sort projects for the "Priority Logic"
    // 1-999 comes first (ascending), then 0 comes last (newest first)
    const projects = [...allProjects].sort((a, b) => {
      const pA = a.sort_order || 0;
      const pB = b.sort_order || 0;

      if (pA === 0 && pB === 0) return 0; // Maintain createdAt desc order
      if (pA === 0) return 1;  // a goes to bottom
      if (pB === 0) return -1; // b goes to bottom
      
      return pA - pB; // Both have priority, sort 1, 2, 3...
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

    return NextResponse.json(sanitizedProjects, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error("Fetch Projects Error:", error);
    return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== (process.env.ADMIN_PASSWORD || 'adminpass123321')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const isStills = body.category === 'STILLS';

    if (!isStills && (!body.title || !body.title.trim())) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 });
    }
    if (!body.year || !body.year.trim()) {
      return NextResponse.json({ error: 'Release year is required' }, { status: 400 });
    }
    if (!isStills && (!body.media_url || !body.media_url.trim())) {
      return NextResponse.json({ error: 'A video URL or uploaded video is required' }, { status: 400 });
    }

    // Reject base64 data URLs for thumbnails (they bloat the database)
    let thumbnailUrl = body.thumbnail_url || null;
    if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
      console.warn('Rejected base64 thumbnail — too large for database storage');
      thumbnailUrl = null;
    }

    const project = await prisma.project.create({
      data: {
        title: (body.title?.trim()) || (isStills ? "" : ""),
        category: body.category as any,
        year: body.year.trim(),
        media_url: (body.media_url?.trim()) || "",
        thumbnail_url: thumbnailUrl,
        role: body.role || null,
        director: body.director || null,
        client: body.client || null,
        production_company: body.production_company || null,
        awards: body.awards || null,
        description: body.description || null,
        long_description: body.long_description || null,
        gallery: body.gallery || [],
        is_public: body.category !== 'FEATURED',
        sort_order: body.sort_order || 0,
      }
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ 
      error: 'Failed to create project', 
      details: error.message,
      hint: 'Check that category matches one of: COMMERCIAL, MUSIC_VIDEO, NARRATIVE, FASHION, STILLS, FEATURED, DOCUMENTARY'
    }, { status: 500 });
  }
}
