import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { findLibraryItems, findLibraryItem, insertLibraryItem, deleteLibraryItem, generateId, now } from '@/lib/db';
import type { LibraryItemType } from '@/types';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code || code.length !== 6) {
    return NextResponse.json({ success: false, error: 'Invalid session code' }, { status: 400 });
  }
  const items = await findLibraryItems(code.toUpperCase());
  return NextResponse.json({ success: true, data: items }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const code = body.session_code;
  if (!code || code.length !== 6) {
    return NextResponse.json({ success: false, error: 'Invalid session code' }, { status: 400 });
  }
  const validTypes: LibraryItemType[] = ['model', 'animation', 'gamepass', 'ui', 'script', 'vfx'];
  if (!body.type || !validTypes.includes(body.type)) {
    return NextResponse.json({ success: false, error: 'Invalid type. Must be: model, animation, gamepass, ui, script, vfx' }, { status: 400 });
  }
  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
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
  return NextResponse.json({ success: true, data: item }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
  }
  const existing = await findLibraryItem(id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
  }
  await deleteLibraryItem(id);
  return NextResponse.json({ success: true, data: { id } }, { status: 200 });
}
