import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/register', 
    '/api/auth',
    '/favicon.ico',
    '/_next' // Important to include Next.js internal routes
  ];
  
  const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath));
  const isApiPath = path.startsWith('/api/');
  
  if (isPublicPath || isApiPath) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      // Don't specify secureCookie or cookieName here
    });
    
    if (!token) {
      // Redirect to login if no token
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to login
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)']
};