import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(apiSuccess(null, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
  }));
}
