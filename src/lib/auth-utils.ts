import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './auth-core';
import { findProfileById } from './db';
import { apiError, apiSuccess, ErrorCodes } from './error-codes';

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
  ) => Promise<any>,
  opts?: { allowAdminKey?: boolean }
) {
  return async (request: NextRequest) => {
    try {
      // Admin API key bypass
      if (opts?.allowAdminKey) {
        const adminKey = request.headers.get('x-admin-key');
        const configuredKey = process.env.ADMIN_API_KEY;
        if (!configuredKey) {
          console.warn('ADMIN_API_KEY not configured — admin key bypass disabled');
        } else if (adminKey && adminKey === configuredKey) {
          return handler(request, {
            userId: 'admin-bot',
            role: 'admin',
            subscriptionActive: false,
            subscriptionExpiresAt: null,
            subscriptionTier: null,
          });
        }
      }

      const token = await getTokenFromRequest(request);
      if (!token) {
        return NextResponse.json(apiError(ErrorCodes.AUTH_TOKEN_MISSING), { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload) {
        return NextResponse.json(apiError(ErrorCodes.AUTH_TOKEN_EXPIRED), { status: 401 });
      }

      const profile = await findProfileById(payload.userId);
      if (!profile) {
        return NextResponse.json(apiError(ErrorCodes.AUTH_USER_NOT_FOUND), { status: 404 });
      }

      return handler(request, {
        userId: payload.userId,
        role: profile.role || 'user',
        subscriptionActive: Boolean(profile.subscription_active),
        subscriptionExpiresAt: profile.subscription_expires_at ?? null,
        subscriptionTier: profile.subscription_tier ?? null,
      });
    } catch (error: unknown) {
      console.error('Auth error:', error);
      return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
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
