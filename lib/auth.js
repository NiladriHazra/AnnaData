import { getSession } from 'next-auth/react';

// Get the current user if authenticated
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

// Check if user is authenticated
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}

// Helper to get authentication info
export async function getAuthInfo() {
  const session = await getSession();
  return {
    isAuthenticated: !!session,
    user: session?.user || null
  };
}

// Logout everywhere function
export async function logoutEverywhere() {
  try {
    const response = await fetch('/api/auth/logoutEverywhere', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to logout from all devices');
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}