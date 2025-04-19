import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Configure the middleware
export async function middleware(request) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/api/auth/signin', '/api/auth/callback'];
  const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath));

  // Check if the path is for API routes (you might want to handle API authentication differently)
  const isApiPath = path.startsWith('/api');

  // If it's a public path, allow the request
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get the session token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // If there's no token and the path isn't public, redirect to login
  if (!token && !isApiPath) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure paths for middleware to run on
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)']
};