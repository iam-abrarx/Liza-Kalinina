import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



export async function GET() {
  try {
    const passes = await prisma.ticketPass.findMany({
      include: { project: true }
    });
    return NextResponse.json(passes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch passes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { pass_code, linked_project_id, expires_at } = await request.json();

    const pass = await prisma.ticketPass.create({
      data: {
        pass_code,
        linked_project_id,
        expires_at: expires_at ? new Date(expires_at) : null
      }
    });

    return NextResponse.json(pass, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create ticket pass' }, { status: 500 });
  }
}
