import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { listWorkspaceSessions } from '@/lib/workspace';
import type { NextRequest } from 'next/server';

export const GET = withAuth(async (_request: NextRequest, context) => {
  try {
    const sessions = await listWorkspaceSessions(context.userId);
    return NextResponse.json({ success: true, data: sessions }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/workspace/list:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
});
