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
  } catch (error: any) {
    console.error(`[API] Delete Pass Error for ${id}:`, error);

    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Ticket pass not found in database.' }, { status: 404 });
    }

    return NextResponse.json({ error: `Failed to delete pass: ${error.message}` }, { status: 500 });
  }
}
