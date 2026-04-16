import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';



export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`[API] Attempting to delete ticket pass: ${id}`);

  try {
    const deleted = await prisma.ticketPass.delete({
      where: { id }
    });
    console.log(`[API] Successfully deleted ticket pass: ${id}`);
    return NextResponse.json({ message: 'Pass deleted', id: deleted.id });
  } catch (error: unknown) {
    console.error(`[API] Delete Pass Error for ${id}:`, error);

    if ((error as any)?.code === 'P2025') {
        return NextResponse.json({ error: 'Ticket pass not found in database.' }, { status: 404 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete pass', details: errorMessage }, { status: 500 });
  }
}
