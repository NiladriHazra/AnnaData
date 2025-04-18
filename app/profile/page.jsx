"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import AuthCheck from '@/components/AuthCheck';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  
  return (
    <AuthCheck>
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4">
                <div className="bg-blue-50 p-4 rounded-lg shadow-md">
                  <div className="flex flex-col items-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-3">
                      {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <h2 className="text-xl font-semibold">{session?.user?.name || "User"}</h2>
                    <p className="text-gray-600">{session?.user?.email || "user@example.com"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      Profile Information
                    </button>
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'preferences' ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}
                      onClick={() => setActiveTab('preferences')}
                    >
                      Dietary Preferences
                    </button>
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}
                      onClick={() => setActiveTab('history')}
                    >
                      Search History
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-3/4">
                {activeTab === 'profile' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Profile Information</h3>
                    <p className="text-gray-600 mb-4">
                      Manage your personal profile information and account settings.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-center text-gray-600">
                        Profile management features will be implemented in a future update.
                      </p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'preferences' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Dietary Preferences</h3>
                    <p className="text-gray-600 mb-4">
                      Set your dietary preferences for better food recommendations.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-center text-gray-600">
                        Dietary preference settings will be implemented in a future update.
                      </p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'history' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Search History</h3>
                    <p className="text-gray-600 mb-4">
                      View your past food searches and nutrition lookups.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-center text-gray-600">
                        Search history features will be implemented in a future update.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </AuthCheck>
  );
}