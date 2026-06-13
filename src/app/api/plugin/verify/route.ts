import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import { findPluginSession } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code || code.length !== 6) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_INVALID_CODE), { status: 400 });
    }
    const session = await findPluginSession(code);
    if (!session) {
      return NextResponse.json(apiSuccess(null, { connected: false }), { status: 200 });
    }
    return NextResponse.json(apiSuccess(null, { connected: session.status === 'active', status: session.status }), { status: 200 });
  } catch (error: unknown) {
    console.error('Error in GET /api/plugin/verify:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
