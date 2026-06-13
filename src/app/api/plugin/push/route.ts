import { NextResponse } from 'next/server';
import { findPluginSession, upsertPluginSession, generateId, now } from '@/lib/db';

export async function POST(request: Request) {
  try {
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

    const newCommandEntry = { id: generateId(), type: type || 'script', name: name || '', code: script || '', executed: false, created_at: now() };
    const updatedCommands = [...(session.commands || []), newCommandEntry];

    const command = {
      id: generateId(),
      type: type || 'script',
      name: name || '',
      code: script || '',
      executed: false,
      created_at: now(),
    };

    await upsertPluginSession(code, {
      ...session,
      commands: updatedCommands,
    });

    return NextResponse.json({
      success: true,
      commandId: command.id,
      pendingAhead: (session.commands || []).filter((c: any) => !c.executed).length,
    });
  } catch (error: any) {
    console.error('Error in POST /api/plugin/push:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
