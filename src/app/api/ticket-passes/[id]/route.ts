import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.ticketPass.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Pass deleted' });
  } catch (error) {
    console.error("Delete Pass Error:", error);
    return NextResponse.json({ error: 'Failed to delete pass' }, { status: 500 });
  }
}
