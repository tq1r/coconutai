import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { findProfileById, updateProfile } from '@/lib/db';
import { verifyToken } from '@/lib/auth-core';

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID || '';
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/roblox/callback`;

export async function GET(request: NextRequest) {
  if (!ROBLOX_CLIENT_ID || !ROBLOX_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/dashboard?roblox=error', request.url));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/dashboard?roblox=error', request.url));
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const payload = await verifyToken(stateData.token);
    if (!payload) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Exchange code for token
    const tokenRes = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: ROBLOX_CLIENT_ID,
        client_secret: ROBLOX_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/dashboard?roblox=token_error', request.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user info from Roblox
    const userRes = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/dashboard?roblox=userinfo_error', request.url));
    }

    const robloxUser = await userRes.json();

    // Save to profile
    updateProfile(payload.userId, {
      roblox_id: robloxUser.sub,
      roblox_username: robloxUser.preferred_username || robloxUser.nickname,
    });

    return NextResponse.redirect(new URL('/dashboard?roblox=linked', request.url));
  } catch {
    return NextResponse.redirect(new URL('/dashboard?roblox=error', request.url));
  }
}
