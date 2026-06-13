import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import type { NextRequest } from 'next/server';
import { signUpWithEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, display_name } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_MISSING_FIELD), { status: 400 });
    }

    const result = await signUpWithEmail(email, password, { username, display_name: display_name || username });

    if (!result.success) {
      return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR, result.error), { status: 400 });
    }

    const response = NextResponse.json(apiSuccess(null, { message: 'Account created successfully.', user: result.user }), { status: 201 });

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
    console.error('Signup error:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
