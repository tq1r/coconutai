import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.includes(pathname);

  const sessionToken = request.cookies.get('coconut-token');

  if (!isPublicRoute && !sessionToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
