import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_MISSING_FIELD), { status: 400 });
    }

    // In a production app, this would send a password reset email.
    // For local development, we return a success message.
    return NextResponse.json(apiSuccess(null, {
      message: 'Password reset instructions sent. (Configure email service for production.)'
    }), { status: 200 });
  } catch (error: unknown) {
    console.error('Reset password error:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
