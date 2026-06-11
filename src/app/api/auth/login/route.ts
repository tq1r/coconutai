import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signInWithEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await signInWithEmail(email, password, !!rememberMe);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

    const response = NextResponse.json({
      success: true,
      user: result.user,
    }, { status: 200 });

    response.cookies.set({
      name: 'coconut-token',
      value: result.token || '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
