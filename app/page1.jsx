"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthCheck from '@/components/AuthCheck';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Image from 'next/image';
import { Camera, Search, Upload, Info, Utensils, Dumbbell, ChefHat, User, Calendar, Flame, Heart, BarChart3, Clock, Bookmark, TrendingUp, Zap, Apple, Scale, Award, Sparkles, X, Home as HomeIcon } from 'lucide-react';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyD2o0V8Kg-T_FQymwvlOyphswEwAxKEQoU");

// Card Components
const NutritionCard = ({ nutrient, value, color, percentage, icon }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-5 rounded-xl shadow-lg transition-all hover:shadow-xl">
      <div className="flex items-center mb-3">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center shadow-md mr-4`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
        <h3 className="text-lg font-medium text-white">{nutrient}</h3>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-white">{value}</span>
        {percentage && (
          <span className="text-sm text-white/70">{percentage}%</span>
        )}
      </div>
      {percentage && (
        <div className="w-full h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
          <div 
            className={`h-full rounded-full ${color}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

const AIInsightCard = ({ insight, icon }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-5 rounded-xl shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-white">AI Insight</h3>
      </div>
      <p className="text-white/80">{insight}</p>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-16 h-16 relative">
        <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-white/20 rounded-full"></div>
        <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-transparent border-t-pink-500 rounded-full animate-spin"></div>
      </div>
      <p className="mt-3 text-white/80 text-lg">Analyzing your food...</p>
    </div>
  );
};

const saveToFoodDiary = async (mealType = 'snack') => {
    try {
      setSavingToDiary(true);
  
      const response = await fetch('/api/diary/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          food: selectedFood,
          mealType,
          date: new Date().toISOString()
        }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save to diary');
      }
  
      // Show success message with animation
      setDiarySuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setDiarySuccess(false);
      }, 3000);
  
    } catch (error) {
      console.error('Error saving to diary:', error);
      // Show error message
      setError(`Failed to save to diary: ${error.message}`);
    } finally {
      setSavingToDiary(false);
    }
  };

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl shadow-lg"
    >
      <div className="bg-gradient-to-br from-orange-500 to-pink-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/70">{description}</p>
    </motion.div>
  );
};

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("home");
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
  const [dailyNutrition, setDailyNutrition] = useState({
    calories: { consumed: 620, goal: 2000 },
    protein: { consumed: 28, goal: 80 },
    carbs: { consumed: 72, goal: 200 },
    fat: { consumed: 18, goal: 60 },
  });
  const [mealTypeDialogOpen, setMealTypeDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  const [savingToDiary, setSavingToDiary] = useState(false);
  const [diarySuccess, setDiarySuccess] = useState(false);
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if we're on client side for localStorage access
  useEffect(() => {
    // Dark theme by default
    document.documentElement.classList.add('dark');
    
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
        
        Format your response as a JSON array with each object having "text" and "icon" fields. 
        Keep each insight under 100 characters.
        Include emojis in the icon field.
        Don't include backticks, markdown formatting, or any other non-JSON syntax in your response.
      `;
      
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the text to ensure valid JSON by removing any markdown formatting
        const cleanedText = text.replace(/```json|```/g, '').trim();
        
        try {
          const insights = JSON.parse(cleanedText);
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
          text: `${food.food_name} provides ${Math.round(food.nutrients.protein)}g of protein, supporting muscle growth.`,
          icon: "💪"
        },
        {
          text: `With ${Math.round(food.nutrients.calories)} calories, this represents about ${Math.round(food.nutrients.calories/2000*100)}% of daily intake.`,
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

  // Function to get nutrition info using Gemini API
  const getFoodInfoFromGemini = async (searchTerm) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Given the food "${searchTerm}", generate realistic nutritional information.
        Return ONLY a valid JSON object with this structure:
        {
          "food_name": "The food name",
          "serving_type": "Standard serving size",
          "calories_calculated_for": numeric value in grams,
          "nutrients": {
            "calories": calories per serving,
            "protein": grams of protein,
            "carbs": grams of carbs,
            "fats": grams of fat
          }
        }
        Make the values realistic for the food type. Only return valid JSON with no markdown formatting, backticks, or additional text.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the text to ensure valid JSON by removing any markdown formatting
      const cleanedText = text.replace(/```json|```/g, '').trim();
      
      // Parse the JSON response
      const foodData = JSON.parse(cleanedText);
      
      // Add missing fields to match our expected structure
      foodData.food_unique_id = `${searchTerm.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      foodData.food_id = Math.floor(Math.random() * 100000);
      foodData.common_names = foodData.food_name;
      foodData.basic_unit_measure = foodData.calories_calculated_for;
      
      return foodData;
    } catch (error) {
      console.error("Error getting food info from Gemini:", error);
      throw error;
    }
  };

  // Function to search and get nutritional information
  const searchFoodAPI = async (searchTerm) => {
    try {
      console.log("Searching for food:", searchTerm);
      setLoading(true);
      setError(null);
      
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
        // First try the API
        const response = await fetch(`/api/searchFood?term=${encodeURIComponent(searchTerm)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add a timeout of 5 seconds
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            console.log("API success response:", data);
            setResults(data.items);
            setLoading(false);
            return;
          }
        }
        
        console.log("API returned no results or error, using Gemini instead");
      } catch (apiError) {
        console.error("API Error:", apiError);
      }
      
      // If API fails, use Gemini instead
      try {
        const foodData = await getFoodInfoFromGemini(searchTerm);
        setResults([foodData]);
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        setError("Sorry, we couldn't find information for that food. Please try another search.");
      }
      
    } catch (error) {
      console.error("Error in search process:", error);
      setError("An error occurred during your search. Please try again.");
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
    setError(null);
    
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
                { text: "What food is in this image? Return only the food name without any additional text, markdown, or explanations." },
                {
                  inlineData: {
                    mimeType: image.type || "image/jpeg",
                    data: base64Image
                  }
                }
              ];
              
              const result = await model.generateContent({ contents: [{ role: "user", parts }] });
              const response = await result.response;
              searchTerm = response.text().trim();
              
              console.log("Gemini identified food:", searchTerm);
              
              // Now search with identified food name
              await searchFoodAPI(searchTerm);
            } catch (directApiError) {
              console.error("Error with Gemini API:", directApiError);
              setError("Sorry, we couldn't identify the food in your image. Please try a text search instead.");
              setLoading(false);
            }
          };
          
          reader.onerror = () => {
            console.error("Error reading image file");
            setShowModal(true);
            setLoading(false);
          };
        } catch (fileReadError) {
          console.error("Error reading file:", fileReadError);
          setError("There was a problem processing your image. Please try again or use text search.");
          setLoading(false);
        }
      } else {
        // If no image, just search by text
        await searchFoodAPI(searchTerm);
      }
    } catch (error) {
      console.error("Error in search process:", error);
      setError("An unexpected error occurred. Please try again.");
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
    
    // Update daily nutrition
    setDailyNutrition(prev => ({
      calories: {
        ...prev.calories,
        consumed: Math.min(prev.calories.consumed + food.nutrients.calories, prev.calories.goal)
      },
      protein: {
        ...prev.protein,
        consumed: Math.min(prev.protein.consumed + food.nutrients.protein, prev.protein.goal)
      },
      carbs: {
        ...prev.carbs,
        consumed: Math.min(prev.carbs.consumed + food.nutrients.carbs, prev.carbs.goal)
      },
      fat: {
        ...prev.fat,
        consumed: Math.min(prev.fat.consumed + food.nutrients.fats, prev.fat.goal)
      }
    }));
  };

  // Function to get food emoji based on name
  const getFoodEmoji = (foodName) => {
    const name = foodName.toLowerCase();
    if (name.includes('pizza')) return '🍕';
    if (name.includes('burger')) return '🍔';
    if (name.includes('chicken')) return '🍗';
    if (name.includes('salad')) return '🥗';
    if (name.includes('paratha')) return '🫓';
    if (name.includes('chow') || name.includes('noodle')) return '🍜';
    if (name.includes('bread') || name.includes('naan')) return '🍞';
    if (name.includes('curry')) return '🍲';
    if (name.includes('rice')) return '🍚';
    if (name.includes('pasta')) return '🍝';
    if (name.includes('cake')) return '🍰';
    if (name.includes('ice cream')) return '🍦';
    if (name.includes('sandwich')) return '🥪';
    if (name.includes('fruit')) return '🍎';
    if (name.includes('egg')) return '🥚';
    return '🍽️';
  };

  return (
    <AuthCheck>
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-white">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="font-bold">
                  <span className="text-2xl md:text-3xl bg-gradient-to-r from-orange-500 to-pink-500 text-transparent bg-clip-text font-devanagari">अन्ना - Data</span>
                </h1>
              </div>
              
              <div className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => setActiveSection("home")}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === "home" ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"}`}
                >
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Home
                </button>
                <button
                  onClick={() => router.push('/fitness')}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Fitness
                </button>
                <button
                  onClick={() => router.push('/recipe')}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ChefHat className="mr-2 h-4 w-4" />
                  Recipes
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </button>
              </div>
              
              <button 
                className="md:hidden text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-black/70 backdrop-blur-lg">
                <button
                  onClick={() => {
                    setActiveSection("home");
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-white/10"
                >
                  <HomeIcon className="mr-3 h-5 w-5" />
                  Home
                </button>
                <button
                  onClick={() => {
                    router.push('/fitness');
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-white/10"
                >
                  <Dumbbell className="mr-3 h-5 w-5" />
                  Fitness
                </button>
                <button
                  onClick={() => {
                    router.push('/recipe');
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-white/10"
                >
                  <ChefHat className="mr-3 h-5 w-5" />
                  Recipes
                </button>
                <button
                  onClick={() => {
                    router.push('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-white/10"
                >
                  <User className="mr-3 h-5 w-5" />
                  Profile
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="container mx-auto px-4 pt-8 pb-24">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 mb-4"
            >
              <span className="font-devanagari">अन्ना - Data</span>
            </motion.h1>
            
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl md:text-3xl font-medium text-white/90"
            >
              Your Nutritional Intelligence Assistant
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
            >
              Discover the nutritional content of any food by searching or uploading a photo.
              Get AI-powered insights tailored to your health goals.
            </motion.p>
          </div>

          {/* Daily Nutrition Summary */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <BarChart3 className="mr-2 h-6 w-6 text-orange-500" />
              Today's Nutrition
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/70">Calories</p>
                  <span className="text-sm font-medium text-white">
                    {dailyNutrition.calories.consumed} / {dailyNutrition.calories.goal}
                  </span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
                    style={{ width: `${(dailyNutrition.calories.consumed / dailyNutrition.calories.goal) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/70">Protein</p>
                  <span className="text-sm font-medium text-white">
                    {dailyNutrition.protein.consumed}g / {dailyNutrition.protein.goal}g
                  </span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${(dailyNutrition.protein.consumed / dailyNutrition.protein.goal) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/70">Carbs</p>
                  <span className="text-sm font-medium text-white">
                    {dailyNutrition.carbs.consumed}g / {dailyNutrition.carbs.goal}g
                  </span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${(dailyNutrition.carbs.consumed / dailyNutrition.carbs.goal) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/70">Fat</p>
                  <span className="text-sm font-medium text-white">
                    {dailyNutrition.fat.consumed}g / {dailyNutrition.fat.goal}g
                  </span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-500"
                    style={{ width: `${(dailyNutrition.fat.consumed / dailyNutrition.fat.goal) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mb-12"
          >
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
              {/* Search Tabs */}
              <div className="flex border-b border-white/20">
                <button 
                  className={`flex items-center px-6 py-4 ${!image ? 'bg-white/10 text-white' : 'text-white/70'}`}
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </button>
                <button 
                  className={`flex items-center px-6 py-4 ${image ? 'bg-white/10 text-white' : 'text-white/70'}`}
                  onClick={() => document.getElementById('food-image').click()}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Image
                </button>
              </div>
              
              <div className="p-6">
                {!image ? (
                  <div className="space-y-6">
                    <div className="relative">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full bg-white/5 border border-white/20 rounded-full py-4 pl-6 pr-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        placeholder="Search for any food..."
                      />
                      <button
                        onClick={handleSearch}
                        className="absolute right-1 top-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full p-3 hover:opacity-90"
                      >
                        <Search className="h-5 w-5 text-white" />
                      </button>
                    </div>
                    
                    {/* Search History */}
                    {searchHistory.length > 0 && !selectedFood && !loading && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        <span className="text-white/50">Recent:</span>
                        {searchHistory.map((term, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setQuery(term);
                              searchFoodAPI(term);
                            }}
                            className="px-4 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-sm transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-center">
                      <p className="text-white/50 mb-3">OR</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        <button
                          onClick={() => document.getElementById('food-image').click()}
                          className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-sm transition-colors"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </button>
                        <button
                          onClick={handleCameraCapture}
                          className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-sm transition-colors"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Take Photo
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative border-2 border-dashed border-white/30 rounded-xl overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Food" 
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="text-center p-4">
                          <h3 className="text-lg font-medium text-white mb-2">Analyzing Image</h3>
                          <p className="text-white/70 mb-4">AI is identifying your food</p>
                          <button
                            onClick={() => {
                              setImage(null);
                              setImagePreview(null);
                            }}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm transition-colors"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSearch}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full text-white font-medium hover:opacity-90"
                    >
                      Analyze Now
                    </button>
                  </div>
                )}
                
                <input 
                  type="file" 
                  id="food-image" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-white rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Camera Modal */}
          {useCamera && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full">
                <div className="p-4 flex justify-between items-center border-b border-white/10">
                  <h3 className="text-lg font-medium text-white">Take a photo of your food</h3>
                  <button 
                    onClick={handleCameraCapture}
                    className="text-white/70 hover:text-white"
                  >
                    <X className="h-6 w-6" />
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
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-lg hover:bg-gray-100"
                  >
                    <svg className="h-8 w-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <circle cx="12" cy="12" r="6" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-4 text-center">
                  <p className="text-white/70 text-sm">Position your food clearly in the frame for the best results</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty Search Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/10">
                <div className="text-center mb-4">
                  <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-orange-500/20 text-orange-500">
                    <Info className="h-8 w-8" />
                  </span>
                </div>
                <h3 className="text-xl font-medium text-white mb-2 text-center">Search Input Required</h3>
                <p className="text-white/70 mb-6 text-center">
                  Please enter a food name or upload a food image to search.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && <LoadingSpinner />}

          {/* Selected Food Detailed View */}
          {selectedFood && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden mb-12 shadow-xl"
              >
                <div className="relative h-40 bg-gradient-to-r from-orange-500 to-pink-500">
                  <button 
                    onClick={() => setSelectedFood(null)}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  
                  <div className="absolute -bottom-12 left-8">
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 w-24 h-24 rounded-xl flex items-center justify-center">
                      <span className="text-4xl">
                        {getFoodEmoji(selectedFood.food_name)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-16 px-8 pb-8">
                  <h2 className="text-3xl font-bold text-white mb-1">{selectedFood.food_name}</h2>
                  <p className="text-white/70 mb-6">
                    {selectedFood.serving_type} ({selectedFood.calories_calculated_for}g)
                  </p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="mr-2 h-5 w-5 text-orange-500" />
                        Nutrition Overview
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <NutritionCard 
                          nutrient="Calories" 
                          value={`${Math.round(selectedFood.nutrients.calories)} kcal`} 
                          color="bg-gradient-to-r from-orange-500 to-pink-500" 
                          icon="🔥"
                        />
                        
                        <NutritionCard 
                          nutrient="Protein" 
                          value={`${selectedFood.nutrients.protein}g`} 
                          color="bg-gradient-to-r from-blue-500 to-cyan-500" 
                          percentage={Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}
                          icon="💪"
                        />
                        
                        <NutritionCard 
                          nutrient="Carbs" 
                          value={`${selectedFood.nutrients.carbs}g`} 
                          color="bg-gradient-to-r from-green-500 to-emerald-500" 
                          percentage={Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}
                          icon="🌾"
                        />
                        
                        <NutritionCard 
                          nutrient="Fat" 
                          value={`${selectedFood.nutrients.fats}g`} 
                          color="bg-gradient-to-r from-yellow-500 to-amber-500" 
                          percentage={Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}
                          icon="🧈"
                        />
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-5 mb-6">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <BarChart3 className="mr-2 h-5 w-5 text-orange-500" />
                          Calorie Distribution
                        </h4>
                        
                        <div className="h-8 w-full flex rounded-lg overflow-hidden mb-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-medium text-white transition-all"
                            style={{ width: `${Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}%` }}
                          >
                            {Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}%
                          </div>
                          
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-xs font-medium text-white transition-all"
                            style={{ width: `${Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}%` }}
                          >
                            {Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}%
                          </div>
                          
                          <div 
                            className="bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center text-xs font-medium text-white transition-all"
                            style={{ width: `${Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}%` }}
                          >
                            {Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}%
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-white/70">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mr-1"></div>
                            <span>Protein</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mr-1"></div>
                            <span>Carbs</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 mr-1"></div>
                            <span>Fat</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowFullAnalysis(true)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <Info className="mr-2 h-5 w-5" />
                        View Full Nutrition Facts
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Sparkles className="mr-2 h-5 w-5 text-orange-500" />
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
                          <div className="flex justify-center py-12">
                            <div className="w-12 h-12 relative">
                              <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-white/20 rounded-full"></div>
                              <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-transparent border-t-pink-500 rounded-full animate-spin"></div>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-5">
                          <h4 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                            <Heart className="h-5 w-5 text-pink-500" />
                            Diet Compatibility
                          </h4>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-white">Vegetarian</span>
                              <div className={`px-3 py-1 rounded-full text-sm ${selectedFood.food_name.toLowerCase().includes('chicken') || selectedFood.food_name.toLowerCase().includes('beef') || selectedFood.food_name.toLowerCase().includes('meat') ? 'bg-red-500/30 text-red-300' : 'bg-green-500/30 text-green-300'}`}>
                                {selectedFood.food_name.toLowerCase().includes('chicken') || selectedFood.food_name.toLowerCase().includes('beef') || selectedFood.food_name.toLowerCase().includes('meat') ? 'Not Suitable' : 'Suitable'}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-white">Vegan</span>
                              <div className={`px-3 py-1 rounded-full text-sm ${selectedFood.food_name.toLowerCase().includes('chicken') || selectedFood.food_name.toLowerCase().includes('cheese') || selectedFood.food_name.toLowerCase().includes('butter') || selectedFood.food_name.toLowerCase().includes('meat') ? 'bg-red-500/30 text-red-300' : 'bg-green-500/30 text-green-300'}`}>
                                {selectedFood.food_name.toLowerCase().includes('chicken') || selectedFood.food_name.toLowerCase().includes('cheese') || selectedFood.food_name.toLowerCase().includes('butter') || selectedFood.food_name.toLowerCase().includes('meat') ? 'Not Suitable' : 'Suitable'}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-white">Keto</span>
                              <div className={`px-3 py-1 rounded-full text-sm ${selectedFood.nutrients.carbs < 15 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                                {selectedFood.nutrients.carbs < 15 ? 'Suitable' : 'Not Suitable'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                      <button
  className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-lg text-white flex items-center justify-center hover:opacity-90 transition-opacity relative overflow-hidden"
  onClick={() => saveToFoodDiary('snack')}
  disabled={savingToDiary}
>
  {savingToDiary ? (
    <>
      <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
      Saving...
    </>
  ) : diarySuccess ? (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute inset-0 bg-green-500 flex items-center justify-center"
      >
        <Check className="mr-1 h-5 w-5" />
        Saved!
      </motion.div>
      <Calendar className="mr-2 h-5 w-5" />
      Save to Diary
    </>
  ) : (
    <>
      <Calendar className="mr-2 h-5 w-5" />
      Save to Diary
    </>
  )}
</button>
                        
                        <button
                          className="py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                          onClick={() => {
                            router.push('/recipe');
                          }}
                        >
                          <ChefHat className="mr-2 h-5 w-5" />
                          Find Recipes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Search Results */}
          {!selectedFood && results.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Utensils className="mr-2 h-6 w-6 text-orange-500" />
                Search Results ({results.length})
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((food) => (
                  <motion.div
                    key={food.food_unique_id}
                    whileHover={{ y: -5 }}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all"
                    onClick={() => showFoodDetails(food)}
                  >
                    <div className="h-20 bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                      <span className="text-3xl">
                        {getFoodEmoji(food.food_name)}
                      </span>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-xl font-medium text-white mb-1 line-clamp-2">{food.food_name}</h3>
                      <p className="text-white/60 mb-4">{food.serving_type} ({food.calories_calculated_for}g)</p>
                      
                      <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/10">
                        <div className="flex justify-between mb-1">
                          <span className="text-white font-medium">Calories</span>
                          <span className="text-white font-bold">{Math.round(food.nutrients.calories)} kcal</span>
                        </div>
                        
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500" 
                            style={{ width: `${Math.min(Math.round(food.nutrients.calories/2000*100), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-white/5 p-2 rounded-lg text-center border border-white/10">
                          <div className="text-blue-300 font-medium text-xs">Protein</div>
                          <div className="text-white font-bold">{food.nutrients.protein}g</div>
                        </div>
                        
                        <div className="bg-white/5 p-2 rounded-lg text-center border border-white/10">
                          <div className="text-green-300 font-medium text-xs">Carbs</div>
                          <div className="text-white font-bold">{food.nutrients.carbs}g</div>
                        </div>
                        
                        <div className="bg-white/5 p-2 rounded-lg text-center border border-white/10">
                          <div className="text-yellow-300 font-medium text-xs">Fat</div>
                          <div className="text-white font-bold">{food.nutrients.fats}g</div>
                        </div>
                      </div>
                      
                      <button className="w-full py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center">
                        <Info className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Featured Sections (when no results or selected food) */}
          {!selectedFood && !loading && results.length === 0 && !error && (
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mb-16"
              >
                <h2 className="text-2xl font-bold text-white mb-8 text-center">
                  Discover More with <span className="font-devanagari">अन्ना - Data</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Fitness Card */}
                  <div 
                    className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer relative"
                    onClick={() => router.push('/fitness')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                    <div className="p-6 relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                        <Dumbbell className="h-8 w-8 text-white" />
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
                  <div 
                    className="bg-gradient-to-br from-purple-500 to-indigo-700 rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer relative"
                    onClick={() => router.push('/recipe')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                    <div className="p-6 relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                        <ChefHat className="h-8 w-8 text-white" />
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
                  <div 
                    className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer relative"
                    onClick={() => router.push('/profile')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                    <div className="p-6 relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-2">Personalized Plan</h3>
                      <p className="text-orange-100 mb-6">Create a customized nutrition plan aligned with your health goals.</p>
                      
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
              </motion.div>

              {/* Features Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  Features That Make <span className="font-devanagari">अन्ना - Data</span> Special
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FeatureCard 
                    icon={<Camera className="h-8 w-8 text-white" />}
                    title="Image Recognition"
                    description="Simply take a photo of your meal and our AI will identify the food and provide detailed nutritional information."
                  />
                  
                  <FeatureCard 
                    icon={<BarChart3 className="h-8 w-8 text-white" />}
                    title="Comprehensive Analysis"
                    description="Get detailed breakdowns of macronutrients, calories, and dietary information for any food item."
                  />
                  
                  <FeatureCard 
                    icon={<Sparkles className="h-8 w-8 text-white" />}
                    title="AI-Powered Insights"
                    description="Receive personalized nutrition advice and health insights based on your food choices and dietary goals."
                  />
                </div>
              </motion.div>

              {/* Trending Foods */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="mt-16"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <TrendingUp className="mr-2 h-6 w-6 text-orange-500" />
                  Trending Foods
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: "Avocado Toast", calories: 240, emoji: "🥑" },
                    { name: "Greek Yogurt", calories: 120, emoji: "🥛" },
                    { name: "Quinoa Bowl", calories: 350, emoji: "🥗" },
                    { name: "Smoothie Bowl", calories: 280, emoji: "🥤" },
                  ].map((food, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ y: -5 }}
                      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden cursor-pointer transition-colors"
                      onClick={() => {
                        setQuery(food.name);
                        searchFoodAPI(food.name);
                      }}
                    >
                      <div className="p-5 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-3xl mb-3">
                          {food.emoji}
                        </div>
                        <h3 className="font-medium text-white mb-1">{food.name}</h3>
                        <p className="text-sm text-white/60">{food.calories} calories</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Full Analysis Modal */}
          {showFullAnalysis && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20"
              >
                <div className="sticky top-0 z-10 bg-gray-900 px-6 py-4 border-b border-white/20 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Full Nutrition Analysis</h2>
                  <button 
                    onClick={() => setShowFullAnalysis(false)}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="overflow-y-auto p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-5">
                        <div className="text-center mb-4">
                          <span className="text-4xl">
                            {getFoodEmoji(selectedFood.food_name)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white text-center mb-1">{selectedFood.food_name}</h3>
                        <p className="text-white/60 text-center mb-4">{selectedFood.serving_type} ({selectedFood.calories_calculated_for}g)</p>
                        
                        <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 font-medium">Calories</span>
                            <span className="text-2xl font-bold text-white">{Math.round(selectedFood.nutrients.calories)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-pink-500" 
                              style={{ width: `${Math.min(Math.round(selectedFood.nutrients.calories/2000*100), 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-end mt-1">
                            <span className="text-xs text-white/50">
                              {Math.round(selectedFood.nutrients.calories/2000*100)}% of 2000 kcal daily value
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-lg font-semibold text-white mb-3">Quick Facts</h4>
                          <ul className="space-y-2 text-white/70">
                            <li className="flex items-center">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mr-2 flex items-center justify-center text-white text-xs">✓</div>
                              <span>
                                {Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}% of calories from protein
                              </span>
                            </li>
                            <li className="flex items-center">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mr-2 flex items-center justify-center text-white text-xs">✓</div>
                              <span>
                                {Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}% of calories from carbs
                              </span>
                            </li>
                            <li className="flex items-center">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 mr-2 flex items-center justify-center text-white text-xs">✓</div>
                              <span>
                                {Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}% of calories from fat
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-2/3">
                      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                        <h3 className="text-xl font-bold border-b-2 border-white/20 pb-2 mb-4 text-white">Nutrition Facts</h3>
                        <p className="text-sm mb-2 text-white/60">Serving Size: {selectedFood.serving_type} ({selectedFood.calories_calculated_for}g)</p>
                        
                        <div className="border-t-8 border-b-4 border-white/30 py-2 mb-2">
                          <div className="flex justify-between">
                            <span className="font-bold text-xl text-white">Calories</span>
                            <span className="font-bold text-xl text-white">{Math.round(selectedFood.nutrients.calories)}</span>
                          </div>
                        </div>
                        
                        {/* Detailed Nutrient Breakdown */}
                        <div className="border-b border-white/20 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">Total Fat</span>
                            <span className="text-white">{selectedFood.nutrients.fats}g</span>
                          </div>
                          <div className="pl-4 text-sm text-white/60">
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
                        
                        <div className="border-b border-white/20 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">Cholesterol</span>
                            <span className="text-white">{Math.round(selectedFood.nutrients.protein * 2.5)}mg</span>
                          </div>
                        </div>
                        
                        <div className="border-b border-white/20 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">Sodium</span>
                            <span className="text-white">{Math.round(selectedFood.calories_calculated_for * 5)}mg</span>
                          </div>
                        </div>
                        
                        <div className="border-b border-white/20 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">Total Carbohydrate</span>
                            <span className="text-white">{selectedFood.nutrients.carbs}g</span>
                          </div>
                          <div className="pl-4 text-sm text-white/60">
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
                        
                        <div className="border-b border-white/20 py-1 mb-4">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">Protein</span>
                            <span className="text-white">{selectedFood.nutrients.protein}g</span>
                          </div>
                        </div>
                        
                        {/* Vitamins and Minerals */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="border-b border-white/20 py-1">
                              <div className="flex justify-between">
                                <span className="text-white/60">Vitamin D</span>
                                <span className="text-white">-</span>
                              </div>
                            </div>
                            
                            <div className="border-b border-white/20 py-1">
                              <div className="flex justify-between">
                                <span className="text-white/60">Calcium</span>
                                <span className="text-white">{Math.round(selectedFood.calories_calculated_for * 0.5)}mg</span>
                              </div>
                            </div>
                            
                            <div className="border-b border-white/20 py-1">
                              <div className="flex justify-between">
                                <span className="text-white/60">Iron</span>
                                <span className="text-white">{(selectedFood.calories_calculated_for * 0.01).toFixed(2)}mg</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="border-b border-white/20 py-1">
                              <div className="flex justify-between">
                                <span className="text-white/60">Potassium</span>
                                <span className="text-white">{Math.round(selectedFood.calories_calculated_for * 3)}mg</span>
                              </div>
                            </div>
                            
                            <div className="border-b border-white/20 py-1">
                              <div className="flex justify-between">
                                <span className="text-white/60">Vitamin A</span>
                                <span className="text-white">{Math.round(selectedFood.calories_calculated_for * 0.6)}mcg</span>
                              </div>
                            </div>
                            
                            <div className="border-b border-white/20 py-1">
                              <div className="flex justify-between">
                                <span className="text-white/60">Vitamin C</span>
                                <span className="text-white">{(selectedFood.calories_calculated_for * 0.05).toFixed(1)}mg</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-white/40 mt-4">
                          * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 
                          2,000 calories a day is used for general nutrition advice.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-5">
                          <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                            <Info className="h-5 w-5 mr-2 text-orange-500" />
                            Allergen Information
                          </h4>
                          <div className="space-y-2">
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                              <h5 className="font-medium text-white mb-2">May contain:</h5>
                              <div className="flex flex-wrap gap-2">
                                {selectedFood.food_name.toLowerCase().includes('cheese') || 
                                 selectedFood.food_name.toLowerCase().includes('butter') && (
                                  <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">
                                    Dairy
                                  </span>
                                )}
                                {selectedFood.food_name.toLowerCase().includes('gluten') && (
                                  <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">
                                    Gluten
                                  </span>
                                )}
                                {selectedFood.food_name.toLowerCase().includes('chicken') && (
                                  <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">
                                    Poultry
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-5">
                          <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                            <Heart className="h-5 w-5 mr-2 text-pink-500" />
                            Health Benefits
                          </h4>
                          
                          <div className="space-y-2 text-white/70 text-sm">
                            <p className="flex items-start">
                              <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                              {selectedFood.nutrients.protein >= 15 ? 
                                "High in protein to support muscle growth and tissue repair" :
                                "Contains protein which helps with muscle maintenance"}
                            </p>
                            
                            <p className="flex items-start">
                              <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                              {selectedFood.nutrients.carbs >= 20 ? 
                                "Rich in carbohydrates, providing energy for physical activities" :
                                "Moderate carbohydrate content for sustained energy"}
                            </p>
                            
                            <p className="flex items-start">
                              <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                              Provides essential calories needed for daily metabolic functions
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4">Similar Foods</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {results.filter(food => food.food_unique_id !== selectedFood.food_unique_id).slice(0, 3).map((food) => (
                        <motion.div 
                          key={food.food_unique_id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all"
                          onClick={() => {
                            setSelectedFood(food);
                            setShowFullAnalysis(false);
                            generateInsights(food);
                          }}
                        >
                          <div className="h-16 bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                            <span className="text-2xl">
                              {getFoodEmoji(food.food_name)}
                            </span>
                          </div>
                          
                          <div className="p-3">
                            <h4 className="text-white font-medium text-sm line-clamp-1">{food.food_name}</h4>
                            <div className="flex justify-between mt-1 text-xs">
                              <span className="text-white/60">{Math.round(food.nutrients.calories)} kcal</span>
                              <span className="text-white/60">{food.serving_type}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-black/40 backdrop-blur-lg border-t border-white/10 py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-transparent bg-clip-text font-devanagari">
                  अन्ना - Data
                </span>
                <p className="text-white/50 mt-1">Discover the nutrition behind your food</p>
              </div>
              
              <div className="flex gap-6">
                <a href="#" className="text-white/60 hover:text-white transition-colors">About</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">Privacy</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">Terms</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
            
            <div className="mt-8 text-center text-xs text-white/40">
              &copy; {new Date().getFullYear()} अन्ना - Data. Created by Niladri Hazra. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </AuthCheck>
  );
}