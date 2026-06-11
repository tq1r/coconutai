import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signUpWithEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, display_name } = await request.json();

    if (!email || !password || !username || !display_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await signUpWithEmail(email, password, { username, display_name });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      user: result.user,
    }, { status: 201 });

    response.cookies.set({
      name: 'coconut-token',
      value: result.token || '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
