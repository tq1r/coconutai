import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import type { NextRequest } from 'next/server';
import { findPluginSession, upsertPluginSession, now } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
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

    const pending = (session.commands || []).filter((c: any) => !c.executed);
    const updatedCommands = (session.commands || []).map((c: any) => ({ ...c, executed: true }));

    await upsertPluginSession(code, {
      ...session,
      commands: updatedCommands,
      last_poll_at: now(),
    });

    return NextResponse.json(apiSuccess(null, {
      commands: pending.map((c: any) => ({ type: c.type || 'script', code: c.code })),
      pendingCount: pending.length,
    }));
  } catch (error: unknown) {
    console.error('Error in GET /api/plugin/poll:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
