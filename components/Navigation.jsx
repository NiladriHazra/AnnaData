"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const NavLink = ({ href, children }) => {
    const isActive = pathname === href;
    
    return (
      <Link href={href}>
        <motion.span 
          className={`px-4 py-2 rounded-md text-lg font-medium ${isActive ? 'text-white bg-teal-500' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {children}
        </motion.span>
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <motion.span 
                  className="text-teal-600 font-bold text-xl cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  AnnaData
                </motion.span>
              </Link>
            </div>
            
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/fitness">Fitness</NavLink>
              <NavLink href="/recipe">Recipe</NavLink>
              <NavLink href="/profile">Profile</NavLink>
            </div>
          </div>
          
          {session && (
            <div className="flex items-center">
              <span className="text-gray-600 mr-4">Hello, {session.user.name}</span>
              <motion.button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1 rounded-md text-sm bg-red-500 text-white hover:bg-red-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign out
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
