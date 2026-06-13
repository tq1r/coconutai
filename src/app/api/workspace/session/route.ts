import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import { getWorkspaceSession, createOrUpdateWorkspaceSession } from '@/lib/workspace';
import type { NextRequest } from 'next/server';

const DEFAULT_WORKSPACE = 'Coconut AI Workspace';

export const GET = withAuth(async (request: NextRequest, context) => {
  const workspaceName = request.nextUrl.searchParams.get('workspace_name') ?? DEFAULT_WORKSPACE;
  const session = await getWorkspaceSession(context.userId, workspaceName);
  return NextResponse.json(apiSuccess(session), { status: 200 });
});

export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const workspaceName = body.workspace_name ?? DEFAULT_WORKSPACE;

    const session = await createOrUpdateWorkspaceSession(context.userId, workspaceName, {
      status: body.status ?? 'active',
      last_synced_at: new Date().toISOString(),
      metadata: body.metadata ?? null,
    });

    if (!session) {
      return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json(apiSuccess(session), { status: 200 });
  } catch (error: unknown) {
    console.error('Error in POST /api/workspace/session:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
});
