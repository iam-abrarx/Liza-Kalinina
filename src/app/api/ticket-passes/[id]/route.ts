import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



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
