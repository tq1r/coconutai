import { NextResponse } from 'next/server';
import { findPluginSession, upsertPluginSession, generateId, now } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { code, script, type, name } = body;

  if (!code || code.length !== 6) {
    return NextResponse.json({ success: false, error: 'Invalid session code' }, { status: 400 });
  }

  const session = await findPluginSession(code);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'closed') {
    return NextResponse.json({ success: false, error: 'Session closed' }, { status: 410 });
  }

  const command = {
    ...session,
    id: generateId(),
    type: type || 'script',
    name: name || '',
    code: script || '',
    executed: false,
    created_at: now(),
    commands: [...(session.commands || []), { id: generateId(), type: type || 'script', name: name || '', code: script || '', executed: false, created_at: now() }],
  };

  await upsertPluginSession(code, {
    ...session,
    commands: command.commands,
  });

  return NextResponse.json({
    success: true,
    commandId: command.id,
    pendingAhead: (session.commands || []).filter((c: any) => !c.executed).length,
  });
}
