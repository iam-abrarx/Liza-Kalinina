import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';



export async function POST(request: Request) {
  try {
    const { passCode } = await request.json();

    if (!passCode) {
      return NextResponse.json({ error: 'Ticket Pass code is required' }, { status: 400 });
    }

    const ticket = await prisma.ticketPass.findUnique({
      where: { pass_code: passCode },
      include: { project: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Invalid Ticket Pass' }, { status: 401 });
    }

    if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Ticket Pass has expired' }, { status: 401 });
    }

    return NextResponse.json({ project: ticket.project });
  } catch (error) {
    console.error("Featured Validation Error:", error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
