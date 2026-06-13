import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import { findPluginSession, upsertPluginSession, generateId, now } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, script, type, name } = body;

    if (!code || code.length !== 6) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_INVALID_CODE), { status: 400 });
    }

    const session = await findPluginSession(code);
    if (!session) {
      return NextResponse.json(apiError(ErrorCodes.PLUGIN_SESSION_NOT_FOUND), { status: 404 });
    }

    if (session.status === 'closed') {
      return NextResponse.json(apiError(ErrorCodes.PLUGIN_SESSION_CLOSED), { status: 410 });
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

    return NextResponse.json(apiSuccess(null, {
      commandId: command.id,
      pendingAhead: (session.commands || []).filter((c: any) => !c.executed).length,
    }));
  } catch (error: unknown) {
    console.error('Error in POST /api/plugin/push:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
