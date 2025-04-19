import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  console.log("Middleware running for path:", path);
  console.log("Request URL:", request.url);
  
  // Allow all API routes to pass through without auth check during debugging
  if (path.startsWith('/api/')) {
    console.log("API route detected, allowing request");
    return NextResponse.next();
  }
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/register', 
    '/api/auth',
    '/favicon.ico'
  ];
  const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath));
  
  if (isPublicPath) {
    console.log("Public path detected, allowing request");
    return NextResponse.next();
  }

  try {
    console.log("Checking for auth token...");
    // Important: specify the secure and domain parameters to match your config
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: true // Match your cookies settings
    });
    
    console.log("Token exists:", !!token);
    
    if (!token) {
      console.log("No token found, redirecting to login");
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
    
    // User is authenticated
    console.log("User is authenticated, allowing request");
    return NextResponse.next();
  } catch (error) {
    console.error("Error in middleware:", error);
    // During debugging, let requests through on error
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)']
};