import { NextResponse } from 'next/server';
import { findPluginSession, getPluginExplorerTree, setPluginExplorerTree, upsertPluginSession } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code || code.length !== 6) {
    return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 });
  }
  const tree = await getPluginExplorerTree(code);
  return NextResponse.json({ success: true, tree, connected: tree !== null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { code, tree } = body;
  if (!code || code.length !== 6 || !tree) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
  const session = await findPluginSession(code);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }
  await setPluginExplorerTree(code, tree);
  return NextResponse.json({ success: true });
}
