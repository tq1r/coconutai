import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { updateProfile } from '@/lib/db';

export const PATCH = withAuth(async (request: NextRequest, context) => {
  if (context.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { targetUserId, role, subscription_tier, subscription_active, subscription_expires_at } = body;

  if (!targetUserId) {
    return NextResponse.json({ error: 'Target user is required' }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (role) updates.role = role;
  if (subscription_tier) updates.subscription_tier = subscription_tier;
  if (typeof subscription_active === 'boolean') updates.subscription_active = subscription_active;
  if (subscription_expires_at) updates.subscription_expires_at = subscription_expires_at;

  updateProfile(targetUserId, updates);

  return NextResponse.json({ success: true, message: 'User updated successfully' }, { status: 200 });
});
