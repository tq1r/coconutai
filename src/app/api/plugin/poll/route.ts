import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { findPluginSession, upsertPluginSession, now } from '@/lib/db';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code || code.length !== 6) {
    return NextResponse.json({ success: false, error: 'Invalid session code' }, { status: 400 });
  }

  const session = await findPluginSession(code);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'closed') {
    return NextResponse.json({ success: false, error: 'Session closed', closed: true }, { status: 410 });
  }

  const pending = (session.commands || []).filter((c: any) => !c.executed);
  const updatedCommands = (session.commands || []).map((c: any) => ({ ...c, executed: true }));

  await upsertPluginSession(code, {
    ...session,
    commands: updatedCommands,
    last_poll_at: now(),
  });

  return NextResponse.json({
    success: true,
    commands: pending.map((c: any) => ({ type: c.type || 'script', code: c.code })),
    pendingCount: pending.length,
  });
}
