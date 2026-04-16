import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    const correctPassword = process.env.ADMIN_PASSWORD;
    
    if (correctPassword && adminPassword === correctPassword) {
      return NextResponse.json({ authenticated: true });
    } else {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
