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
  ChefHat,
  Info
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();

 // In your login handler function:

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    console.log("Login attempt for:", email);
    
    // Use a single sign-in attempt with redirect:true
    const result = await signIn('credentials', {
      redirect: false, // Initially false to check for errors
      email,
      password
    });

    console.log("SignIn result:", result);

    if (result.error) {
      setError(result.error);
    } else {
      setShowSuccessMessage(true);
      
      // Use window.location for a direct navigation
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  } catch (error) {
    console.error("Login error:", error);
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

     // In the handleRegister function
if (result.error) {
  setError(result.error);
} else {
  setShowSuccessMessage(true);
  setTimeout(() => {
    window.location.href = '/';
  }, 1500);
}
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fill demo credentials
  const useDemoAccount = () => {
    setEmail('demo@gmail.com');
    setPassword('12345678');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#070B14] via-[#0b1120] to-[#0A0E1A] text-white">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      
      {/* Animated glowing orbs */}
      <div className="fixed top-1/4 -right-28 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="fixed top-3/4 -left-28 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      
      <div className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-4">
        <AnimatePresence mode="wait">
          {showSuccessMessage ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-900/90 to-black/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 w-full max-w-md border border-indigo-500/30 shadow-xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mb-3 sm:mb-4">
                  <Check className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Success!</h2>
                <p className="text-slate-300">Redirecting you to your dashboard...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-900/90 to-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl w-full max-w-md border border-slate-700/50 shadow-xl overflow-hidden"
            >
              {/* Logo and title */}
              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 pt-5 sm:pt-6 pb-4 sm:pb-5 px-4 sm:px-6 text-center">
                <div className="flex justify-center mb-2.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                    <ChefHat className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                अन्ना-Data
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">Your Nutritional Intelligence Assistant</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-700/50">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${
                    activeTab === 'login'
                      ? 'text-white border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center text-sm">
                    <LogIn className="h-3.5 w-3.5 mr-1.5" />
                    Sign In
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${
                    activeTab === 'register'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center text-sm">
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Register
                  </span>
                </button>
              </div>
              
              {/* Demo account section */}
              <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-0">
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-700/30 rounded-lg p-2.5 mb-3"
                >
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-amber-300 font-medium text-xs">Demo Account</h3>
                      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                        <div className="bg-black/30 rounded px-2 py-0.5">
                          <p className="text-xs text-amber-200/70 text-[10px]">Email</p>
                          <p className="text-xs font-mono text-amber-100 text-[10px]">demo@gmail.com</p>
                        </div>
                        <div className="bg-black/30 rounded px-2 py-0.5">
                          <p className="text-xs text-amber-200/70 text-[10px]">Password</p>
                          <p className="text-xs font-mono text-amber-100 text-[10px]">12345678</p>
                        </div>
                      </div>
                      <button 
                        onClick={useDemoAccount}
                        className="w-full mt-1.5 bg-amber-700/30 hover:bg-amber-700/50 text-amber-300 text-[10px] py-1 rounded transition-colors flex items-center justify-center"
                      >
                        <ArrowRight className="h-2.5 w-2.5 mr-1" />
                        Use Demo Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              <div className="p-4 sm:p-6 pt-2 sm:pt-4">
                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 mb-4 flex items-start"
                  >
                    <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-red-200">{error}</span>
                  </motion.div>
                )}
                
                {/* Form */}
                <form onSubmit={activeTab === 'login' ? handleSubmit : handleRegister}>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete={activeTab === 'login' ? "current-password" : "new-password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                          placeholder={activeTab === 'login' ? "Enter your password" : "Create a password"}
                        />
                      </div>
                    </div>
                    
                    {activeTab === 'login' && (
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
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
                        className={`w-full py-2 sm:py-2.5 px-4 rounded-lg text-white text-sm font-medium flex items-center justify-center transition-all
                          ${activeTab === 'login' 
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600' 
                            : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600'}
                          disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
                          </>
                        ) : (
                          <>
                            {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </form>
                
                {/* Alternative options */}
                <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-700/50 text-center">
                  <p className="text-xs sm:text-sm text-slate-400">
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
        <p className="mt-4 sm:mt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} AnnaData • All rights reserved
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