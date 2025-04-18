"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import AuthCheck from '@/components/AuthCheck';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Image from 'next/image';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyD2o0V8Kg-T_FQymwvlOyphswEwAxKEQoU");

// Mock data for fallback
const getMockData = (searchTerm) => {
  // Basic mock data that mimics the API response structure
  const chickenData = {
    results: 5,
    items: [
      {
        food_name: 'Chicken Curry',
        common_names: 'Chicken curry',
        food_unique_id: 'chicken-curry-123',
        food_id: 12345,
        serving_type: '1/2 chicken breast with sauce',
        calories_calculated_for: 138.5,
        basic_unit_measure: 138.5,
        nutrients: {
          fats: 8.60,
          carbs: 6.11,
          protein: 14.80,
          calories: 160,
        },
      },
      {
        food_name: 'Butter Chicken',
        common_names: 'Murgh Makhani',
        food_unique_id: 'butter-chicken-456',
        food_id: 45678,
        serving_type: '1 serving',
        calories_calculated_for: 220,
        basic_unit_measure: 220,
        nutrients: {
          fats: 14.2,
          carbs: 8.5,
          protein: 22.3,
          calories: 250,
        },
      },
      {
        food_name: 'Chicken Tikka Masala',
        common_names: 'Chicken Tikka',
        food_unique_id: 'chicken-tikka-789',
        food_id: 78901,
        serving_type: '1 cup',
        calories_calculated_for: 185,
        basic_unit_measure: 185,
        nutrients: {
          fats: 12.8,
          carbs: 10.2,
          protein: 19.5,
          calories: 235,
        },
      }
    ]
  };
  
  const pizzaData = {
    results: 3,
    items: [
      {
        food_name: 'Cheese Pizza (Slice)',
        common_names: 'Pizza',
        food_unique_id: 'pizza-cheese-123',
        food_id: 23456,
        serving_type: 'slice',
        calories_calculated_for: 107,
        basic_unit_measure: 107,
        nutrients: {
          fats: 10.4,
          carbs: 33.6,
          protein: 12.3,
          calories: 285,
        },
      },
      {
        food_name: 'Pepperoni Pizza (Slice)',
        common_names: 'Pepperoni Pizza',
        food_unique_id: 'pizza-pep-456',
        food_id: 34567,
        serving_type: 'slice',
        calories_calculated_for: 113,
        basic_unit_measure: 113,
        nutrients: {
          fats: 12.1,
          carbs: 33.3,
          protein: 13.2,
          calories: 298,
        },
      }
    ]
  };
  
  const burgerData = {
    results: 2,
    items: [
      {
        food_name: 'Chicken Masala Whopper burger (Burger king)',
        common_names: 'Chicken Masala Whopper',
        food_unique_id: 'burger-masala-123',
        food_id: 56789,
        serving_type: '1 burger',
        calories_calculated_for: 296,
        basic_unit_measure: 296,
        nutrients: {
          fats: 37,
          carbs: 62,
          protein: 28,
          calories: 691,
        },
      }
    ]
  };

  // Return appropriate mock data based on search term
  const term = searchTerm.toLowerCase();
  if (term.includes('chicken') && term.includes('curry')) {
    return chickenData;
  } else if (term.includes('butter') && term.includes('chicken')) {
    return chickenData; // Return chicken data but highlight butter chicken
  } else if (term.includes('pizza')) {
    return pizzaData;
  } else if (term.includes('burger') || term.includes('whopper')) {
    return burgerData;
  } else {
    // Default chicken data if no match
    return chickenData;
  }
};

// Nutrition Card Component
const NutritionCard = ({ nutrient, value, color, percentage, icon }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 transition-all">
      <div className="flex items-center mb-3">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center shadow-md mr-4`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
        <h3 className="text-lg font-medium text-slate-800 dark:text-white">{nutrient}</h3>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-slate-800 dark:text-white">{value}</span>
        {percentage && (
          <span className="text-sm text-slate-500 dark:text-slate-400">{percentage}%</span>
        )}
      </div>
      {percentage && (
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
          <div 
            className={`h-full rounded-full ${color}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

// AI Insight Card Component
const AIInsightCard = ({ insight, icon }) => {
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-slate-800 dark:text-white">AI Insight</h3>
      </div>
      <p className="text-slate-600 dark:text-slate-300">{insight}</p>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-3 text-slate-600 dark:text-slate-300">Processing your request...</p>
    </div>
  );
};

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Check if we're on client side for localStorage access
  useEffect(() => {
    // Set color scheme based on system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
    
    // Load search history from localStorage
    try {
      const history = localStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (e) {
      console.error("Error loading search history from localStorage:", e);
    }
  }, []);
  
  // Generate AI insights for a food item
  const generateInsights = async (food) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        Provide 3 short health insights about ${food.food_name} with these nutritional facts:
        - Calories: ${food.nutrients.calories} kcal
        - Protein: ${food.nutrients.protein}g
        - Carbs: ${food.nutrients.carbs}g
        - Fat: ${food.nutrients.fats}g
        
        Format as JSON array with each object having "text" and "icon" fields. 
        Keep each insight under 100 characters.
        Include emojis in the icon field.
      `;
      
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse JSON if valid, otherwise use fallback
        try {
          const insights = JSON.parse(text);
          setAiInsights(insights);
          return;
        } catch (jsonError) {
          console.error("Error parsing Gemini response:", jsonError);
          // Continue to fallback
        }
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        // Continue to fallback
      }
      
      // Fallback insights
      const fallbackInsights = [
        {
          text: `${food.food_name} provides ${Math.round(food.nutrients.protein)}g of protein, supporting muscle growth and recovery.`,
          icon: "💪"
        },
        {
          text: `With ${Math.round(food.nutrients.calories)} calories, this portion represents about ${Math.round(food.nutrients.calories/2000*100)}% of a daily diet.`,
          icon: "🔥"
        },
        {
          text: `Balance your meal with vegetables to complement the ${Math.round(food.nutrients.carbs)}g of carbs in this serving.`,
          icon: "🥗"
        }
      ];
      
      setAiInsights(fallbackInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
      setAiInsights([
        {
          text: "Protein helps build and repair tissues in your body.",
          icon: "💪"
        },
        {
          text: "Maintain balanced meals by combining proteins, carbs, and healthy fats.",
          icon: "⚖️"
        },
        {
          text: "Stay hydrated! Water helps your body process nutrients effectively.",
          icon: "💧"
        }
      ]);
    }
  };

  // Function to search the food API with fallback to mock data
  const searchFoodAPI = async (searchTerm) => {
    try {
      console.log("Searching for food:", searchTerm);
      setLoading(true);
      
      // Add search term to history
      const updatedHistory = [searchTerm, ...(searchHistory || [])].filter((item, index, self) => 
        index === self.findIndex(t => t === item)
      ).slice(0, 5);
      
      setSearchHistory(updatedHistory);
      
      try {
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
      
      try {
        // Try the API first
        const response = await fetch(`/api/searchFood?term=${encodeURIComponent(searchTerm)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (response.ok && data.items && data.items.length > 0) {
          console.log("API success response:", data);
          setResults(data.items);
          return;
        }
        
        console.log("API returned no results or error, falling back to mock data");
        // Fall back to mock data if API fails or returns no results
      } catch (apiError) {
        console.error("API Error:", apiError);
        console.log("Falling back to mock data");
        // Continue to mock data
      }
      
      // Use mock data as fallback
      const mockData = getMockData(searchTerm);
      console.log("Using mock data:", mockData);
      setResults(mockData.items);
      
    } catch (error) {
      console.error("Error in search process:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle text & image search
  const handleSearch = async () => {
    if (!query && !image) {
      setShowModal(true);
      return;
    }
    
    setLoading(true);
    setResults([]);
    setSelectedFood(null);
    
    try {
      let searchTerm = query;
      
      // If there's an image, use Gemini to identify the food
      if (image) {
        try {
          // Convert image to base64
          const reader = new FileReader();
          reader.readAsDataURL(image);
          
          reader.onload = async () => {
            try {
              const base64Image = reader.result.split(',')[1];
              
              // Try with direct Gemini API
              const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
              
              // Create parts with text prompt and image
              const parts = [
                { text: "What food is in this image? Return only the food name without any additional text." },
                {
                  inlineData: {
                    mimeType: image.type || "image/jpeg",
                    data: base64Image
                  }
                }
              ];
              
              const result = await model.generateContent({ contents: [{ role: "user", parts }] });
              const response = await result.response;
              searchTerm = response.text();
              
              console.log("Gemini identified food:", searchTerm);
              
              // Now search with identified food name
              await searchFoodAPI(searchTerm);
            } catch (directApiError) {
              console.error("Error with Gemini API:", directApiError);
              
              // Fall back to hardcoded response for demo
              const foodTypes = ['Chicken Curry', 'Butter Chicken', 'Pizza', 'Burger', 'Salad'];
              searchTerm = foodTypes[Math.floor(Math.random() * foodTypes.length)];
              console.log("Using fallback food identification:", searchTerm);
              await searchFoodAPI(searchTerm);
            }
          };
          
          reader.onerror = () => {
            console.error("Error reading image file");
            setShowModal(true);
            setLoading(false);
          };
        } catch (fileReadError) {
          console.error("Error reading file:", fileReadError);
          await searchFoodAPI(query || "chicken curry"); // Fallback
        }
      } else {
        // If no image, just search by text
        await searchFoodAPI(searchTerm);
      }
    } catch (error) {
      console.error("Error in search process:", error);
      setLoading(false);
    }
  };

  // Handle file input change for image upload
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      
      // Auto-search when image is selected
      setTimeout(() => handleSearch(), 500);
    }
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    setUseCamera(!useCamera);
    if (!useCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.getElementById('camera-preview');
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    } else {
      const videoElement = document.getElementById('camera-preview');
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    }
  };

  // Take a photo from the camera stream
  const takePhoto = () => {
    const videoElement = document.getElementById('camera-preview');
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0);
    
    canvas.toBlob((blob) => {
      setImage(blob);
      setImagePreview(canvas.toDataURL('image/jpeg'));
      
      // Close camera and auto search
      if (videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        setUseCamera(false);
        
        // Auto-search with the captured photo
        setTimeout(() => handleSearch(), 500);
      }
    }, 'image/jpeg');
  };

  // Show detailed analysis for a selected food
  const showFoodDetails = (food) => {
    setSelectedFood(food);
    generateInsights(food);
  };

  return (
    <AuthCheck>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        {/* Custom Navigation - this will be replaced by the Navigation component */}
        <div className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="font-bold">
                    <span className="text-2xl md:text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text font-devanagari">अन्ना - Data</span>
                  </h1>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-center space-x-6">
                  <a href="/" className="text-slate-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium">Home</a>
                  <a href="/fitness" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium">Fitness</a>
                  <a href="/recipe" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium">Recipe</a>
                  <a href="/profile" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium">Profile</a>
                </div>
              </div>
              <div className="md:hidden">
                <button className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hero Section */}
        <div className="relative bg-white dark:bg-slate-900 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white dark:bg-slate-900 sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 xl:mt-20">
                <div className="text-center">
                  <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
                    <span className="block font-devanagari">अन्ना - Data</span>
                    <span className="block text-indigo-600 dark:text-indigo-400 text-2xl sm:text-3xl mt-3">Nutritional Intelligence Assistant</span>
                  </h1>
                  <p className="mt-3 max-w-md mx-auto text-base text-slate-500 dark:text-slate-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Discover the nutritional content of any food by simply searching or uploading a photo.
                    Get AI-powered insights tailored to your health goals.
                  </p>
                </div>

                <div className="mt-10 sm:flex sm:justify-center lg:justify-center">
                  {/* Search Box */}
                  <div className="w-full max-w-xl">
                    <div className="mt-1 flex rounded-full shadow-xl">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-6 pr-12 sm:text-sm border-slate-300 dark:border-slate-700 rounded-l-full py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="Search for any food..."
                      />
                      <button
                        onClick={handleSearch}
                        className="inline-flex items-center px-6 py-2 border border-transparent rounded-r-full shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                      </button>
                    </div>

                    <div className="mt-4 flex justify-center space-x-4">
                      <button
                        onClick={() => document.getElementById('food-image').click()}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload Image
                      </button>
                      <button
                        onClick={handleCameraCapture}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-full text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {useCamera ? "Close Camera" : "Use Camera"}
                      </button>
                      <input 
                        type="file" 
                        id="food-image" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>

                    {/* Search History */}
                    {searchHistory.length > 0 && !selectedFood && !loading && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2 justify-center">
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Recent:</span>
                          {searchHistory.map((term, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setQuery(term);
                                searchFoodAPI(term);
                              }}
                              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>

        {/* Camera Preview Modal */}
        {useCamera && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full">
              <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Take a photo of your food</h3>
                <button 
                  onClick={handleCameraCapture}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="relative bg-black">
                <video 
                  id="camera-preview" 
                  autoPlay 
                  className="w-full h-72 sm:h-96 object-cover"
                />
                <button
                  onClick={takePhoto}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-4 rounded-full shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4">
                <p className="text-slate-600 dark:text-slate-400 text-sm">Position your food clearly in the frame for the best results</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty Search Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
              <div className="text-center mb-4">
                <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2 text-center">Search Input Required</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
                Please enter a food name or upload a food image to search.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Image Preview */}
          {imagePreview && !selectedFood && (
            <div className="mb-6 flex justify-center">
              <div className="relative max-w-lg w-full">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className="aspect-w-16 aspect-h-9 relative rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Selected food" 
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <p className="text-white text-lg font-medium">Analyzing food image...</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {loading && <LoadingSpinner />}

          {/* Selected Food Detailed View */}
          {selectedFood && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 h-32 sm:h-48">
                <button 
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="absolute -bottom-12 left-6 sm:left-8">
                  <div className="bg-white dark:bg-slate-700 w-24 h-24 rounded-xl shadow-lg border-4 border-white dark:border-slate-700 flex items-center justify-center">
                    <span className="text-4xl">
                      {selectedFood.food_name.toLowerCase().includes('pizza') ? '🍕' : 
                       selectedFood.food_name.toLowerCase().includes('burger') ? '🍔' : 
                       selectedFood.food_name.toLowerCase().includes('chicken') ? '🍗' : 
                       selectedFood.food_name.toLowerCase().includes('salad') ? '🥗' : '🍽️'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-16 px-6 pb-6 sm:px-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">{selectedFood.food_name}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {selectedFood.serving_type} ({selectedFood.calories_calculated_for}g)
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Nutrition Overview
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <NutritionCard 
                        nutrient="Calories" 
                        value={`${Math.round(selectedFood.nutrients.calories)} kcal`} 
                        color="bg-rose-600" 
                        icon="🔥"
                      />
                      
                      <NutritionCard 
                        nutrient="Protein" 
                        value={`${selectedFood.nutrients.protein}g`} 
                        color="bg-emerald-600" 
                        percentage={Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}
                        icon="🥩"
                      />
                      
                      <NutritionCard 
                        nutrient="Carbs" 
                        value={`${selectedFood.nutrients.carbs}g`} 
                        color="bg-blue-600" 
                        percentage={Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}
                        icon="🌾"
                      />
                      
                      <NutritionCard 
                        nutrient="Fat" 
                        value={`${selectedFood.nutrients.fats}g`} 
                        color="bg-amber-600" 
                        percentage={Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}
                        icon="🧈"
                      />
                    </div>
                    
                    {/* Calorie Distribution Chart */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl shadow mb-6 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        Calorie Distribution
                      </h4>
                      
                      <div className="h-8 w-full flex rounded-lg overflow-hidden mb-2">
                        <div 
                          className="bg-emerald-600 flex items-center justify-center text-xs font-medium text-white transition-all duration-500"
                          style={{ width: `${Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}%` }}
                        >
                          {Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}%
                        </div>
                        
                        <div
                          className="bg-blue-600 flex items-center justify-center text-xs font-medium text-white transition-all duration-500"
                          style={{ width: `${Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}%` }}
                        >
                          {Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}%
                        </div>
                        
                        <div 
                          className="bg-amber-600 flex items-center justify-center text-xs font-medium text-white transition-all duration-500"
                          style={{ width: `${Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}%` }}
                        >
                          {Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}%
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-emerald-600 mr-1"></div>
                          <span>Protein</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>
                          <span>Carbs</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-600 mr-1"></div>
                          <span>Fat</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowFullAnalysis(true)}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white rounded-lg shadow-md flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Get Full Nutrition Analysis
                    </button>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI-Powered Insights
                    </h3>
                    
                    <div className="space-y-4 mb-6">
                      {aiInsights.length > 0 ? (
                        aiInsights.map((insight, index) => (
                          <AIInsightCard 
                            key={index}
                            insight={insight.text}
                            icon={insight.icon}
                          />
                        ))
                      ) : (
                        <div className="flex justify-center py-8">
                          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                      
                      <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                        <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-white mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Diet Compatibility
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${selectedFood.food_name.toLowerCase().includes('veg') && !selectedFood.food_name.toLowerCase().includes('non') ? 'bg-emerald-500' : 'bg-rose-500'} mr-2`}></div>
                            <span className="text-slate-700 dark:text-slate-300">
                              {selectedFood.food_name.toLowerCase().includes('veg') && !selectedFood.food_name.toLowerCase().includes('non') ? 'Suitable for vegetarians' : 'Not suitable for vegetarians'}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-rose-500 mr-2"></div>
                            <span className="text-slate-700 dark:text-slate-300">Not suitable for vegans</span>
                          </div>
                          
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${selectedFood.nutrients.carbs < 15 ? 'bg-emerald-500' : 'bg-rose-500'} mr-2`}></div>
                            <span className="text-slate-700 dark:text-slate-300">
                              {selectedFood.nutrients.carbs < 15 ? 'Keto-friendly' : 'Not keto-friendly'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-white rounded-lg shadow-md flex items-center justify-center"
                        onClick={() => router.push('/fitness')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Save to Diary
                      </button>
                      
                      <button
                        className="py-3 px-4 bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 text-white rounded-lg shadow-md flex items-center justify-center"
                        onClick={() => router.push('/recipe')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Find Recipes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {!selectedFood && results.length > 0 && !loading && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Search Results ({results.length})
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((food) => (
                  <div 
                    key={food.food_unique_id}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-700"
                    onClick={() => showFoodDetails(food)}
                  >
                    <div className="h-20 bg-gradient-to-r from-indigo-600 to-purple-700 flex items-center justify-center">
                      <span className="text-3xl">
                        {food.food_name.toLowerCase().includes('pizza') ? '🍕' : 
                         food.food_name.toLowerCase().includes('burger') ? '🍔' : 
                         food.food_name.toLowerCase().includes('chicken') ? '🍗' : 
                         food.food_name.toLowerCase().includes('salad') ? '🥗' : '🍽️'}
                      </span>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-1 line-clamp-2">{food.food_name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{food.serving_type} ({food.calories_calculated_for}g)</p>
                      
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">Calories</span>
                          <span className="text-slate-900 dark:text-white font-bold">{Math.round(food.nutrients.calories)} kcal</span>
                        </div>
                        
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600" 
                            style={{ width: `${Math.min(Math.round(food.nutrients.calories/2000*100), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-center">
                          <div className="text-emerald-800 dark:text-emerald-400 font-medium text-xs">Protein</div>
                          <div className="text-slate-900 dark:text-white font-bold">{food.nutrients.protein}g</div>
                        </div>
                        
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-center">
                          <div className="text-blue-800 dark:text-blue-400 font-medium text-xs">Carbs</div>
                          <div className="text-slate-900 dark:text-white font-bold">{food.nutrients.carbs}g</div>
                        </div>
                        
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-center">
                          <div className="text-amber-800 dark:text-amber-400 font-medium text-xs">Fat</div>
                          <div className="text-slate-900 dark:text-white font-bold">{food.nutrients.fats}g</div>
                        </div>
                      </div>
                      
                      <button className="w-full py-2 text-sm bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Featured Sections (when no results or selected food) */}
          {!selectedFood && !loading && results.length === 0 && !imagePreview && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                Discover More with <span className="font-devanagari">अन्ना - Data</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fitness Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push('/fitness')}>
                  <div className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">Fitness Tracking</h3>
                    <p className="text-emerald-100 mb-6">Track your workouts and monitor your progress toward your health goals.</p>
                    
                    <div className="flex justify-end">
                      <span className="text-white text-sm flex items-center">
                        Explore
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Recipe Card */}
                <div className="bg-gradient-to-br from-purple-500 to-indigo-700 rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push('/recipe')}>
                  <div className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">Healthy Recipes</h3>
                    <p className="text-purple-100 mb-6">Discover delicious recipes tailored to your nutritional preferences.</p>
                    
                    <div className="flex justify-end">
                      <span className="text-white text-sm flex items-center">
                        Explore
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Nutrition Plan Card */}
                <div className="bg-gradient-to-br from-rose-500 to-amber-600 rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push('/profile')}>
                  <div className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">Personalized Plan</h3>
                    <p className="text-amber-100 mb-6">Create a customized nutrition plan aligned with your health goals.</p>
                    
                    <div className="flex justify-end">
                      <span className="text-white text-sm flex items-center">
                        Explore
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
                  Features That Make <span className="font-devanagari">अन्ना - Data</span> Special
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-100 dark:border-slate-700">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Image Recognition</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Simply take a photo of your meal and our AI will identify the food and provide detailed nutritional information.
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-100 dark:border-slate-700">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Comprehensive Analysis</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Get detailed breakdowns of macronutrients, calories, and dietary information for any food item.
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-100 dark:border-slate-700">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI-Powered Insights</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Receive personalized nutrition advice and health insights based on your food choices and dietary goals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full Analysis Modal */}
        {showFullAnalysis && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Full Nutrition Analysis</h2>
                <button 
                  onClick={() => setShowFullAnalysis(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-y-auto p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                      <div className="text-center mb-4">
                        <span className="text-4xl">
                          {selectedFood.food_name.toLowerCase().includes('pizza') ? '🍕' : 
                           selectedFood.food_name.toLowerCase().includes('burger') ? '🍔' : 
                           selectedFood.food_name.toLowerCase().includes('chicken') ? '🍗' : 
                           selectedFood.food_name.toLowerCase().includes('salad') ? '🥗' : '🍽️'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-1">{selectedFood.food_name}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-center mb-4">{selectedFood.serving_type} ({selectedFood.calories_calculated_for}g)</p>
                      
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">Calories</span>
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(selectedFood.nutrients.calories)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                          <div 
                            className="h-full bg-indigo-600" 
                            style={{ width: `${Math.min(Math.round(selectedFood.nutrients.calories/2000*100), 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-end mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {Math.round(selectedFood.nutrients.calories/2000*100)}% of 2000 kcal daily value
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Quick Facts</h4>
                        <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}% of calories from protein
                            </span>
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}% of calories from carbs
                            </span>
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}% of calories from fat
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-2/3">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                      <h3 className="text-xl font-bold border-b-2 border-slate-200 dark:border-slate-700 pb-1 mb-4 text-slate-900 dark:text-white">Nutrition Facts</h3>
                      <p className="text-sm mb-2 text-slate-600 dark:text-slate-400">Serving Size: {selectedFood.serving_type} ({selectedFood.calories_calculated_for}g)</p>
                      
                      <div className="border-t-8 border-b-4 border-slate-900 dark:border-slate-700 py-2 mb-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-xl text-slate-900 dark:text-white">Calories</span>
                          <span className="font-bold text-xl text-slate-900 dark:text-white">{Math.round(selectedFood.nutrients.calories)}</span>
                        </div>
                      </div>
                      
                      {/* Detailed Nutrient Breakdown */}
                      <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Total Fat</span>
                          <span className="text-slate-900 dark:text-white">{selectedFood.nutrients.fats}g</span>
                        </div>
                        <div className="pl-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Saturated Fat</span>
                            <span>{(selectedFood.nutrients.fats * 0.3).toFixed(1)}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Trans Fat</span>
                            <span>0g</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Polyunsaturated Fat</span>
                            <span>{(selectedFood.nutrients.fats * 0.25).toFixed(1)}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Monounsaturated Fat</span>
                            <span>{(selectedFood.nutrients.fats * 0.45).toFixed(1)}g</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Cholesterol</span>
                          <span className="text-slate-900 dark:text-white">{Math.round(selectedFood.nutrients.protein * 2.5)}mg</span>
                        </div>
                      </div>
                      
                      <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Sodium</span>
                          <span className="text-slate-900 dark:text-white">{Math.round(selectedFood.calories_calculated_for * 5)}mg</span>
                        </div>
                      </div>
                      
                      <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Total Carbohydrate</span>
                          <span className="text-slate-900 dark:text-white">{selectedFood.nutrients.carbs}g</span>
                        </div>
                        <div className="pl-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Dietary Fiber</span>
                            <span>{(selectedFood.nutrients.carbs * 0.1).toFixed(1)}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sugars</span>
                            <span>{(selectedFood.nutrients.carbs * 0.2).toFixed(1)}g</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-b border-slate-300 dark:border-slate-700 py-1 mb-4">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Protein</span>
                          <span className="text-slate-900 dark:text-white">{selectedFood.nutrients.protein}g</span>
                        </div>
                      </div>
                      
                      {/* Vitamins and Minerals */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Vitamin D</span>
                              <span className="text-slate-900 dark:text-white">-</span>
                            </div>
                          </div>
                          
                          <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Calcium</span>
                              <span className="text-slate-900 dark:text-white">{Math.round(selectedFood.calories_calculated_for * 0.5)}mg</span>
                            </div>
                          </div>
                          
                          <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Iron</span>
                              <span className="text-slate-900 dark:text-white">{(selectedFood.calories_calculated_for * 0.01).toFixed(2)}mg</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Potassium</span>
                              <span className="text-slate-900 dark:text-white">{Math.round(selectedFood.calories_calculated_for * 3)}mg</span>
                            </div>
                          </div>
                          
                          <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Vitamin A</span>
                              <span className="text-slate-900 dark:text-white">{Math.round(selectedFood.calories_calculated_for * 0.6)}mcg</span>
                            </div>
                          </div>
                          
                          <div className="border-b border-slate-300 dark:border-slate-700 py-1">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Vitamin C</span>
                              <span className="text-slate-900 dark:text-white">{(selectedFood.calories_calculated_for * 0.05).toFixed(1)}mg</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                        * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 
                        2,000 calories a day is used for general nutrition advice.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Allergen Information
                        </h4>
                        <div className="space-y-2">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h5 className="font-medium text-slate-900 dark:text-white mb-2">May contain:</h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedFood.food_name.toLowerCase().includes('cheese') || 
                               selectedFood.food_name.toLowerCase().includes('butter') && (
                                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full text-xs">
                                  Dairy
                                </span>
                              )}
                              {selectedFood.food_name.toLowerCase().includes('gluten') && (
                                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full text-xs">
                                  Gluten
                                </span>
                              )}
                              {selectedFood.food_name.toLowerCase().includes('chicken') && (
                                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full text-xs">
                                  Poultry
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Health Benefits
                        </h4>
                        
                        <div className="space-y-2 text-slate-700 dark:text-slate-300 text-sm">
                          <p className="flex items-start">
                            <span className="text-emerald-600 dark:text-emerald-400 mr-2 flex-shrink-0">✓</span>
                            {selectedFood.nutrients.protein >= 15 ? 
                              "High in protein to support muscle growth and tissue repair" :
                              "Contains protein which helps with muscle maintenance"}
                          </p>
                          
                          <p className="flex items-start">
                            <span className="text-emerald-600 dark:text-emerald-400 mr-2 flex-shrink-0">✓</span>
                            {selectedFood.nutrients.carbs >= 20 ? 
                              "Rich in carbohydrates, providing energy for physical activities" :
                              "Moderate carbohydrate content for sustained energy"}
                          </p>
                          
                          <p className="flex items-start">
                            <span className="text-emerald-600 dark:text-emerald-400 mr-2 flex-shrink-0">✓</span>
                            Provides essential calories needed for daily metabolic functions
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Similar Foods</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {results.filter(food => food.food_unique_id !== selectedFood.food_unique_id).slice(0, 3).map((food) => (
                      <div 
                        key={food.food_unique_id}
                        className="bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden cursor-pointer border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                        onClick={() => {
                          setSelectedFood(food);
                          setShowFullAnalysis(false);
                          generateInsights(food);
                        }}
                      >
                        <div className="h-16 bg-gradient-to-r from-indigo-600 to-purple-700 flex items-center justify-center">
                          <span className="text-2xl">
                            {food.food_name.toLowerCase().includes('pizza') ? '🍕' : 
                             food.food_name.toLowerCase().includes('burger') ? '🍔' : 
                             food.food_name.toLowerCase().includes('chicken') ? '🍗' : 
                             food.food_name.toLowerCase().includes('salad') ? '🥗' : '🍽️'}
                          </span>
                        </div>
                        
                        <div className="p-3">
                          <h4 className="text-slate-900 dark:text-white font-medium text-sm line-clamp-1">{food.food_name}</h4>
                          <div className="flex justify-between mt-1 text-xs">
                            <span className="text-slate-600 dark:text-slate-400">{Math.round(food.nutrients.calories)} kcal</span>
                            <span className="text-slate-600 dark:text-slate-400">{food.serving_type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl font-bold font-devanagari mb-2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">अन्ना - Data</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Your AI-Powered Nutritional Intelligence Assistant
                </p>
              </div>
              
              <div className="flex flex-wrap gap-8 justify-center">
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">About</a>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">Features</a>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">Privacy</a>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">Terms</a>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">Contact</a>
              </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} अन्ना - Data. Created by Niladri Hazra. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-slate-400 hover:text-indigo-500">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-indigo-500">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-indigo-500">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-indigo-500">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </AuthCheck>
  );
}