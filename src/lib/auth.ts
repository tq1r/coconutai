import { findProfileByEmail, findProfileByUsername, findProfileById, insertProfile, updateProfile, generateId, now } from './db';
import { hashPassword, verifyPassword, createToken, verifyToken } from './auth-core';
import type { User } from '@/types';

export async function getCurrentUser(token?: string): Promise<User | null> {
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const row = await findProfileById(payload.userId);
  if (!row) return null;
  return mapRowToUser(row);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  userData: { username: string; display_name: string }
) {
  const existingEmail = await findProfileByEmail(email);
  if (existingEmail) {
    return { success: false, error: 'Email already taken' };
  }
  const existingUsername = await findProfileByUsername(userData.username);
  if (existingUsername) {
    return { success: false, error: 'Username already taken' };
  }

  const id = generateId();
  const passwordHash = await hashPassword(password);
  const t = now();

  await insertProfile({
    id, email, username: userData.username, display_name: userData.display_name,
    avatar_url: null, role: 'user', subscription_tier: 'free', subscription_active: false,
    subscription_expires_at: null, password_hash: passwordHash,
    roblox_id: null, roblox_username: null,
    created_at: t, updated_at: t,
  });

  const token = await createToken({ userId: id, email, role: 'user' });
  return {
    success: true,
    user: { id, email, username: userData.username, display_name: userData.display_name, role: 'user' },
    token,
  };
}

export async function signInWithEmail(email: string, password: string, rememberMe = false) {
  const row = await findProfileByEmail(email);
  if (!row) return { success: false, error: 'Invalid email or password' };

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return { success: false, error: 'Invalid email or password' };

  const token = await createToken({ userId: row.id, email: row.email, role: row.role }, rememberMe);
  return {
    success: true,
    user: { id: row.id, email: row.email, username: row.username, display_name: row.display_name, role: row.role },
    token,
  };
}

export async function signOut() {
  return { success: true };
}

export async function updateUserSubscription(userId: string, tier: 'free' | 'plus' | 'pro', active: boolean, expiresAt?: string) {
  await updateProfile(userId, { subscription_tier: tier, subscription_active: active, subscription_expires_at: expiresAt || null });
  return { success: true };
}

export async function updateUserRole(userId: string, role: 'user' | 'premium' | 'admin') {
  await updateProfile(userId, { role });
  return { success: true };
}

function mapRowToUser(row: any): User {
  return {
    id: row.id, email: row.email, username: row.username, display_name: row.display_name,
    avatar_url: row.avatar_url || undefined, role: row.role,
    subscription_tier: row.subscription_tier, subscription_active: Boolean(row.subscription_active),
    subscription_expires_at: row.subscription_expires_at || undefined,
    roblox_id: row.roblox_id || undefined, roblox_username: row.roblox_username || undefined,
    created_at: row.created_at, updated_at: row.updated_at,
  };
}
