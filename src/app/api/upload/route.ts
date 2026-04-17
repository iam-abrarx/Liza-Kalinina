import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov']);
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(request: Request) {
  try {
    // Security check via header (consistent with all other APIs)
    const adminPassword = request.headers.get('x-admin-password');
    const correctPassword = process.env.ADMIN_PASSWORD;
    if (!correctPassword || adminPassword !== correctPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 500MB)' }, { status: 400 });
    }

    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename — strip original name to avoid path traversal
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}${ext}`;
    
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const path = join(uploadsDir, filename);
    await writeFile(path, buffer);

    console.log(`[UPLOAD] File saved locally: /uploads/${filename}`);

    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      message: 'File uploaded successfully to local storage' 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Server error during upload: ' + errorMessage },
      { status: 500 }
    );
  }
}
