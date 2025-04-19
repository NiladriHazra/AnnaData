"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  AlertCircle, 
  LogIn, 
  UserPlus,
  Check,
  ChefHat
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (result.error) {
        setError(result.error);
      } else {
        setShowSuccessMessage(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: email.split('@')[0], // Simple name from email
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Automatically sign in after successful registration
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (result.error) {
        setError(result.error);
      } else {
        setShowSuccessMessage(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#070B14] via-[#0b1120] to-[#0A0E1A] text-white">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      
      {/* Animated glowing orbs */}
      <div className="fixed top-1/4 -right-28 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="fixed top-3/4 -left-28 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <AnimatePresence mode="wait">
          {showSuccessMessage ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-900/90 to-black/80 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-indigo-500/30 shadow-xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                <p className="text-slate-300">Redirecting you to your dashboard...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-900/90 to-black/80 backdrop-blur-xl rounded-2xl w-full max-w-md border border-slate-700/50 shadow-xl overflow-hidden"
            >
              {/* Logo and title */}
              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 pt-8 pb-6 px-8 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                    <ChefHat className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                अन्ना-Data
                </h1>
                <p className="text-slate-400 mt-1">Your Nutritional Intelligence Assistant</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-700/50">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'login'
                      ? 'text-white border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'register'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </span>
                </button>
              </div>
              
              <div className="p-8">
                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/20 border border-red-700/40 rounded-lg p-4 mb-6 flex items-start"
                  >
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-200">{error}</span>
                  </motion.div>
                )}
                
                {/* Form */}
                <form onSubmit={activeTab === 'login' ? handleSubmit : handleRegister}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-10 pr-3 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete={activeTab === 'login' ? "current-password" : "new-password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-10 pr-3 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          placeholder={activeTab === 'login' ? "Enter your password" : "Create a password"}
                        />
                      </div>
                    </div>
                    
                    {activeTab === 'login' && (
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                    
                    <div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center transition-all
                          ${activeTab === 'login' 
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600' 
                            : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600'}
                          disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
                          </>
                        ) : (
                          <>
                            {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </form>
                
                {/* Alternative options */}
                <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
                  <p className="text-sm text-slate-400">
                    {activeTab === 'login' 
                      ? "Don't have an account? " 
                      : "Already have an account? "}
                    <button
                      onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
                      className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      {activeTab === 'login' ? 'Register now' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Footer text */}
        <p className="mt-8 text-sm text-slate-500">
          © 2025 AnnaData • All rights reserved
        </p>
      </div>
      
      {/* Add CSS animation for floating particles */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100px) translateX(20px);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}