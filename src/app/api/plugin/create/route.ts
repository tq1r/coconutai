import { NextResponse } from 'next/server';
import { findPluginSession, upsertPluginSession, generateId, now } from '@/lib/db';

export async function POST() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  const session = {
    id: generateId(),
    code,
    commands: [],
    created_at: now(),
    last_poll_at: null,
  };

  await upsertPluginSession(code, session);
  return NextResponse.json({ success: true, code });
}
