import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { updateProfile, findProfileByEmail, findProfileByUsername, findProfileById } from '@/lib/db';

export const PATCH = withAuth(async (request: NextRequest, context) => {
  if (context.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { targetUserId, role, subscription_tier, subscription_active, subscription_expires_at } = body;

  if (!targetUserId) {
    return NextResponse.json({ error: 'Target user is required' }, { status: 400 });
  }

  let user = await findProfileById(targetUserId);
  if (!user) user = await findProfileByEmail(targetUserId);
  if (!user) user = await findProfileByUsername(targetUserId);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updates: Record<string, any> = {};
  if (role) updates.role = role;
  if (subscription_tier) updates.subscription_tier = subscription_tier;
  if (typeof subscription_active === 'boolean') updates.subscription_active = subscription_active;
  if (subscription_expires_at !== undefined) updates.subscription_expires_at = subscription_expires_at;

  await updateProfile(user.id, updates);

  return NextResponse.json({
    success: true,
    message: `${user.username} updated successfully`,
    user: { id: user.id, username: user.username, email: user.email, role: updates.role || user.role, subscription_active: typeof subscription_active === 'boolean' ? subscription_active : user.subscription_active },
  }, { status: 200 });
}, { allowAdminKey: true });

export const GET = withAuth(async (request: NextRequest, context) => {
  if (context.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const targetUserId = request.nextUrl.searchParams.get('targetUserId');
  if (targetUserId) {
    let user = await findProfileById(targetUserId);
    if (!user) user = await findProfileByEmail(targetUserId);
    if (!user) user = await findProfileByUsername(targetUserId);
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, user });
  }
  return NextResponse.json({ success: true, message: 'Admin API ready' });
}, { allowAdminKey: true });
