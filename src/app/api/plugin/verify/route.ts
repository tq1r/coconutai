import { NextResponse } from 'next/server';
import { findPluginSession } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code || code.length !== 6) {
      return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 });
    }
    const session = await findPluginSession(code);
    if (!session) {
      return NextResponse.json({ success: false, connected: false }, { status: 200 });
    }
    return NextResponse.json({ success: true, connected: session.status === 'active', status: session.status }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/plugin/verify:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
