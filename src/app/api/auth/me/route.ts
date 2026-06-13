import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import type { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-utils';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(apiError(ErrorCodes.AUTH_TOKEN_MISSING), { status: 401 });
    }

    const user = await getCurrentUser(token);
    if (!user) {
      return NextResponse.json(apiError(ErrorCodes.AUTH_USER_NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(apiSuccess(null, { user }), { status: 200 });
  } catch (error: unknown) {
    console.error('Get current user error:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
