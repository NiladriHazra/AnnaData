"use client";

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import AuthCheck from '@/components/AuthCheck';

export default function RecipePage() {
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Recipe Collection</h1>
            <p className="text-lg text-gray-600 mb-6">
              Discover healthy and delicious recipes tailored to your nutritional needs.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
                <p>Recipe features will be implemented in a future update. Stay tuned!</p>
              </div>
              
              <div className="bg-yellow-50 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Recipe Recommendations</h2>
                <p>Get personalized recipe recommendations based on your nutritional preferences.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </AuthCheck>
  );
}