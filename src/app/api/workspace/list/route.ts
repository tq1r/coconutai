import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import { listWorkspaceSessions } from '@/lib/workspace';
import type { NextRequest } from 'next/server';

export const GET = withAuth(async (_request: NextRequest, context) => {
  try {
    const sessions = await listWorkspaceSessions(context.userId);
    return NextResponse.json(apiSuccess(sessions), { status: 200 });
  } catch (error: unknown) {
    console.error('Error in GET /api/workspace/list:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
});
