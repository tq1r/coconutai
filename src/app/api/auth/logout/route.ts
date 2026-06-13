import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(apiSuccess(null, { message: 'Logged out successfully' }), { status: 200 });
    response.cookies.delete('coconut-token');
    return response;
  } catch (error: unknown) {
    console.error('Logout error:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
