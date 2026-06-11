import { NextResponse } from 'next/server';
import { getAvailableModels } from '@/lib/ai-service';

export async function GET() {
  return NextResponse.json({ success: true, models: getAvailableModels() }, { status: 200 });
}
