import { NextResponse } from 'next/server';
import { apiError, apiSuccess, ErrorCodes } from '@/lib/error-codes';
import type { NextRequest } from 'next/server';
import { findLibraryItems, findLibraryItem, insertLibraryItem, deleteLibraryItem, generateId, now } from '@/lib/db';
import type { LibraryItemType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    if (!code || code.length !== 6) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_INVALID_CODE), { status: 400 });
    }
    const items = await findLibraryItems(code.toUpperCase());
    return NextResponse.json(apiSuccess(items), { status: 200 });
  } catch (error: unknown) {
    console.error('Error in GET /api/plugin/library:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body.session_code;
    if (!code || code.length !== 6) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_INVALID_CODE), { status: 400 });
    }
    const validTypes: LibraryItemType[] = ['model', 'animation', 'gamepass', 'ui', 'script', 'vfx'];
    if (!body.type || !validTypes.includes(body.type)) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_INVALID_INPUT), { status: 400 });
    }
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_MISSING_FIELD), { status: 400 });
    }
    const item = {
      id: generateId(),
      session_code: code.toUpperCase(),
      type: body.type,
      name: (body.name || 'Untitled').slice(0, 100),
      description: (body.description || '').slice(0, 500),
      content: body.content,
      created_at: now(),
    };
    await insertLibraryItem(item);
    return NextResponse.json(apiSuccess(item), { status: 200 });
  } catch (error: unknown) {
    console.error('Error in POST /api/plugin/library:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(apiError(ErrorCodes.VALIDATION_MISSING_FIELD), { status: 400 });
    }
    const existing = await findLibraryItem(id);
    if (!existing) {
      return NextResponse.json(apiError(ErrorCodes.RESOURCE_NOT_FOUND), { status: 404 });
    }
    await deleteLibraryItem(id);
    return NextResponse.json(apiSuccess({ id }), { status: 200 });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/plugin/library:', error);
    return NextResponse.json(apiError(ErrorCodes.SERVER_INTERNAL_ERROR), { status: 500 });
  }
}
