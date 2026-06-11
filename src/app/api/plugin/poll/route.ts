import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { findPluginSession, upsertPluginSession, now } from '@/lib/db';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ success: false, error: 'Missing code' }, { status: 400 });

  const session = await findPluginSession(code);
  if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });

  // Return all unexecuted commands and mark them as executed
  const pending = (session.commands || []).filter((c: any) => !c.executed);
  const updatedCommands = (session.commands || []).map((c: any) => ({ ...c, executed: true }));

  await upsertPluginSession(code, {
    ...session,
    commands: updatedCommands,
    last_poll_at: now(),
  });

  return NextResponse.json({ success: true, commands: pending.map((c: any) => c.code) });
}
