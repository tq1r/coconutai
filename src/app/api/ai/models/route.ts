import { NextResponse } from 'next/server';
import { getAvailableModels } from '@/lib/ai-service';

export async function GET() {
  try {
    return NextResponse.json({ success: true, models: getAvailableModels() }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/ai/models:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
