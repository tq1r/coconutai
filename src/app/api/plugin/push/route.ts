import { NextResponse } from 'next/server';
import { findPluginSession, upsertPluginSession, generateId, now } from '@/lib/db';

export async function POST(request: Request) {
  const { code, script } = await request.json();
  if (!code || code.length !== 6) {
    return NextResponse.json({ success: false, error: 'Invalid session code' }, { status: 400 });
  }
  if (!script || typeof script !== 'string') {
    return NextResponse.json({ success: false, error: 'Missing script content' }, { status: 400 });
  }

  const session = await findPluginSession(code);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'closed') {
    return NextResponse.json({ success: false, error: 'Session closed' }, { status: 410 });
  }

  const command = {
    id: generateId(),
    code: script,
    executed: false,
    created_at: now(),
  };

  await upsertPluginSession(code, {
    ...session,
    commands: [...(session.commands || []), command],
    last_push_at: now(),
  });

  return NextResponse.json({
    success: true,
    commandId: command.id,
    pushedAt: command.created_at,
    pendingAhead: (session.commands || []).filter((c: any) => !c.executed).length,
  });
}
