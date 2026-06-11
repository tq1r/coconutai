import { findProfileByUsername, updateProfile } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const profile = await findProfileByUsername('tq1r');
    if (!profile) {
      return NextResponse.json({ success: false, error: 'User tq1r not found' });
    }
    await updateProfile(profile.id, { role: 'premium', subscription_tier: 'pro', subscription_active: true });
    return NextResponse.json({ success: true, message: `User tq1r (${profile.email}) is now premium`, user: profile });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
