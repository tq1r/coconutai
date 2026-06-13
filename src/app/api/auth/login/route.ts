import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import type { NextRequest } from 'next/server';
import { signInWithEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_MISSING_FIELD), { status: 400 });
    }

    const result = await signInWithEmail(email, password);
    if (!result.success) {
      return NextResponse.json(apiError(ErrorCodes.AUTH_INVALID_CREDENTIALS, result.error), { status: 401 });
    }

    const response = NextResponse.json(apiSuccess(null, { user: result.user }), { status: 200 });

    response.cookies.set({
      name: 'coconut-token',
      value: result.token || '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
