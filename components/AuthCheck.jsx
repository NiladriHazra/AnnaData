"use client";

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCheck({ children }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session && pathname !== '/login') {
      router.push('/login');
    }
  }, [session, loading, router, pathname]);

  // If user is not authenticated and we're not on login page
  if (!session && pathname !== '/login') {
    return null;
  }

  // If we're on login page but already authenticated
  if (session && pathname === '/login') {
    router.push('/');
    return null;
  }

  return children;
}