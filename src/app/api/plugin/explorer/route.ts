import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import { findPluginSession, getPluginExplorerTree, setPluginExplorerTree, upsertPluginSession } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code || code.length !== 6) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_INVALID_CODE), { status: 400 });
    }
    const tree = await getPluginExplorerTree(code);
    return NextResponse.json(apiSuccess(null, { tree, connected: tree !== null }));
  } catch (error: unknown) {
    console.error('Error in GET /api/plugin/explorer:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, tree } = body;
    if (!code || code.length !== 6 || !tree) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_INVALID_INPUT), { status: 400 });
    }
    const session = await findPluginSession(code);
    if (!session) {
      return NextResponse.json(apiError(ErrorCodes.PLUGIN_SESSION_NOT_FOUND), { status: 404 });
    }
    await setPluginExplorerTree(code, tree);
    return NextResponse.json(apiSuccess(undefined));
  } catch (error: unknown) {
    console.error('Error in POST /api/plugin/explorer:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
