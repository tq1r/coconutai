import { NextResponse } from 'next/server';
import { getAvailableModels } from '@/lib/ai-service';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';

export async function GET() {
  try {
    return NextResponse.json(apiSuccess(null, { models: getAvailableModels() }), { status: 200 });
  } catch (error: unknown) {
    console.error('Error in GET /api/ai/models:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
