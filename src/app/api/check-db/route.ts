import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Check if env is present
    const envPresent = !!process.env.DATABASE_URL;
    const dbUrlStart = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'MISSING';

    // 2. Try simple query
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;

    return NextResponse.json({
      status: 'success',
      message: 'Database connection established',
      env_present: envPresent,
      db_url_start: dbUrlStart,
      latency_ms: duration,
      node_version: process.version,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: errorMessage,
      env_present: !!process.env.DATABASE_URL,
    }, { status: 500 });
  }
}
