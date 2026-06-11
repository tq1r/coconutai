import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-utils';

export const GET = withAuth(async (_request: NextRequest, context) => {
  if (context.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ success: true, role: context.role }, { status: 200 });
});
