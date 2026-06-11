import { NextResponse } from 'next/server';
import { findPluginSession, upsertPluginSession, generateId, now } from '@/lib/db';

export async function POST(request: Request) {
  const { code, script } = await request.json();
  if (!code || !script) return NextResponse.json({ success: false, error: 'Missing code or script' }, { status: 400 });

  const session = await findPluginSession(code);
  if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });

  const command = { id: generateId(), code: script, executed: false, created_at: now() };
  await upsertPluginSession(code, {
    ...session,
    commands: [...(session.commands || []), command],
  });

  return NextResponse.json({ success: true, commandId: command.id });
}
