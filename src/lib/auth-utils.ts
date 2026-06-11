import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './auth-core';
import { findProfileById } from './db';

export async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return request.cookies.get('coconut-token')?.value ?? null;
}

export function withAuth(
  handler: (
    req: NextRequest,
    context: {
      userId: string;
      role: string;
      subscriptionActive: boolean;
      subscriptionExpiresAt: string | null;
      subscriptionTier: string | null;
    }
  ) => Promise<any>
) {
  return async (request: NextRequest) => {
    try {
      const token = await getTokenFromRequest(request);
      if (!token) {
        return NextResponse.json({ error: 'Missing or invalid authorization token' }, { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }

      const profile = await findProfileById(payload.userId);
      if (!profile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      return handler(request, {
        userId: payload.userId,
        role: profile.role || 'user',
        subscriptionActive: Boolean(profile.subscription_active),
        subscriptionExpiresAt: profile.subscription_expires_at ?? null,
        subscriptionTier: profile.subscription_tier ?? null,
      });
    } catch (error: any) {
      console.error('Auth error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await findProfileById(userId);
    return profile?.role === 'admin';
  } catch {
    return false;
  }
}

export async function hasPremium(userId: string): Promise<boolean> {
  try {
    const profile = await findProfileById(userId);
    if (!profile?.subscription_active) return false;
    if (profile.subscription_expires_at) {
      return new Date(profile.subscription_expires_at) > new Date();
    }
    return true;
  } catch {
    return false;
  }
}
