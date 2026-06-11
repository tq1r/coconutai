import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-utils';
import { verifyToken } from '@/lib/auth-core';

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID || '';
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/roblox/callback`;

// Step 1: Redirect user to Roblox OAuth
export async function GET(request: NextRequest) {
  if (!ROBLOX_CLIENT_ID || !ROBLOX_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Roblox OAuth not configured. Set ROBLOX_CLIENT_ID and ROBLOX_CLIENT_SECRET in .env' }, { status: 501 });
  }

  const token = await getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const state = Buffer.from(JSON.stringify({ userId: payload.userId, token })).toString('base64');

  const params = new URLSearchParams({
    client_id: ROBLOX_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile',
    state,
  });

  return NextResponse.redirect(`https://authorize.roblox.com/?${params}`);
}
