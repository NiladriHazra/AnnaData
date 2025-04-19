"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import AuthCheck from "@/components/AuthCheck";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Image from "next/image";
import {
  Camera,
  Search,
  Upload,
  Info,
  Utensils,
  Dumbbell,
  ChefHat,
  User,
  Calendar,
  Flame,
  Heart,
  BarChart3,
  Clock,
  Bookmark,
  TrendingUp,
  Zap,
  Apple,
  Scale,
  Award,
  Sparkles,
  X,
  Home as HomeIcon,
  Check,
  LogIn,
  Bell,
  Settings,
  ArrowRight,
  Share2,
} from "lucide-react";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ""
);

// Card Components
const NutritionCard = ({ nutrient, value, color, percentage, icon }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 p-5 rounded-xl shadow-lg transition-all hover:border-slate-600 hover:shadow-xl"
    >
      <div className="flex items-center mb-3">
        <div
          className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center shadow-lg mr-4`}
        >
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
        <div className="w-full h-2 bg-slate-700/40 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
    </motion.div>
  );
};

const AIInsightCard = ({ insight, icon }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 p-5 rounded-xl shadow-lg hover:border-slate-600 hover:shadow-xl transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-md">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-white">AI Insight</h3>
      </div>
      <p className="text-white/80">{insight}</p>
    </motion.div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="relative w-20 h-20">
        <div className="w-20 h-20 rounded-full border-4 border-slate-700/50 absolute top-0 left-0"></div>
        <div className="w-20 h-20 rounded-full border-4 border-t-indigo-600 border-r-purple-600 border-transparent absolute top-0 left-0 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse"></div>
        </div>
      </div>
      <p className="mt-5 text-slate-300 text-xl font-medium bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
        Analyzing your food...
      </p>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <motion.div
      whileHover={{
        y: -8,
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-lg transition-all hover:border-slate-600"
    >
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 w-16 h-16 rounded-xl flex items-center justify-center mb-5 shadow-md">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-300">{description}</p>
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
  const [error, setError] = useState(null);
  const [savingToDiary, setSavingToDiary] = useState(false);
  const [diarySuccess, setDiarySuccess] = useState(false);
  const [mealTypeDialogOpen, setMealTypeDialogOpen] = useState(false);
  
  // New state for notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  // New state for food diary
  const [showDiaryView, setShowDiaryView] = useState(false);
  const [diaryItems, setDiaryItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeMealFilter, setActiveMealFilter] = useState('all');
  
  // New state for sharing
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  
  // New state for seasonal foods
  const [showSeasonalFoods, setShowSeasonalFoods] = useState(false);
  const [seasonalFoods, setSeasonalFoods] = useState([]);
  const [currentSeason, setCurrentSeason] = useState("");
  const [loadingSeasonalFoods, setLoadingSeasonalFoods] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs for the camera
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Function to determine current season
  const determineCurrentSeason = () => {
    const now = new Date();
    const month = now.getMonth();
    
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer";
    if (month >= 8 && month <= 10) return "Fall";
    return "Winter";
  };

  // Generate notifications using Gemini API
  const generateNotifications = async () => {
    setIsLoadingNotifications(true);
    
    try {
      // Get user's saved foods from localStorage
      const savedFoods = JSON.parse(localStorage.getItem('savedFoods') || '[]');
      const recentFoods = savedFoods.slice(0, 3).map(item => item.food.food_name);
      
      // Create a prompt for Gemini
      const prompt = `
        Generate 3-5 personalized nutrition notifications for a user who recently logged these foods:
        ${recentFoods.length ? recentFoods.join(', ') : 'No recent food logs'}
        
        Each notification should include:
        1. A short personalized message about nutrition or health (keep it under 120 characters)
        2. A priority level (low, medium, high)
        3. A category (tip, reminder, achievement, insight)
        
        Return ONLY a valid JSON array with objects having these fields:
        - message: string
        - priority: string
        - category: string
        - icon: emoji representation 
        - timestamp: use current date/time 
        
        Make the notifications encouraging and actionable. No explanations or additional text.
      `;
      
      // Call Gemini API
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the text to ensure valid JSON
      const cleanedText = text.replace(/```json|```/g, "").trim();
      
      // Parse the response
      const generatedNotifications = JSON.parse(cleanedText);
      
      // Add IDs and read status to notifications
      const notificationsWithIds = generatedNotifications.map((notification, index) => ({
        ...notification,
        id: Date.now() + index,
        read: false,
        timestamp: new Date().toISOString()
      }));
      
      // Save to state and localStorage
      setNotifications(notificationsWithIds);
      setUnreadCount(notificationsWithIds.length);
      localStorage.setItem('notifications', JSON.stringify(notificationsWithIds));
    } catch (error) {
      console.error("Error generating notifications:", error);
      // Fallback notifications
      const fallbackNotifications = [
        {
          id: Date.now(),
          message: "Remember to log your water intake today!",
          category: "reminder",
          priority: "medium", 
          icon: "💧",
          read: false,
          timestamp: new Date().toISOString()
        },
        {
          id: Date.now() + 1,
          message: "Try adding more protein to your next meal for better muscle recovery",
          category: "tip",
          priority: "low",
          icon: "💪",
          read: false,
          timestamp: new Date().toISOString()
        }
      ];
      
      setNotifications(fallbackNotifications);
      setUnreadCount(fallbackNotifications.length);
      localStorage.setItem('notifications', JSON.stringify(fallbackNotifications));
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = (id) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ 
      ...notification, 
      read: true 
    }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  // Function to load diary items
  const loadDiaryItems = useCallback(() => {
    try {
      // Get saved foods from localStorage
      const savedFoods = JSON.parse(localStorage.getItem('savedFoods') || '[]');
      setDiaryItems(savedFoods);
    } catch (e) {
      console.error("Error loading diary items:", e);
      setDiaryItems([]);
    }
  }, []);

  // Filter diary items by date
  const getDiaryItemsByDate = useCallback((date, mealType = 'all') => {
    const targetDate = new Date(date).toDateString();
    let filtered = diaryItems.filter(item => {
      const itemDate = new Date(item.date).toDateString();
      return itemDate === targetDate;
    });
    
    if (mealType !== 'all') {
      filtered = filtered.filter(item => item.mealType === mealType);
    }
    
    return filtered;
  }, [diaryItems]);

  // Calculate nutrition totals for diary items
  const calculateTotals = useCallback((items) => {
    return items.reduce((totals, item) => {
      const { calories, protein, carbs, fats } = item.food.nutrients;
      return {
        calories: totals.calories + calories,
        protein: totals.protein + protein,
        carbs: totals.carbs + carbs,
        fat: totals.fat + fats
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, []);

  // Delete an item from diary
  const removeDiaryItem = (timestamp) => {
    const updatedItems = diaryItems.filter(item => 
      new Date(item.date).getTime() !== timestamp
    );
    setDiaryItems(updatedItems);
    localStorage.setItem('savedFoods', JSON.stringify(updatedItems));
  };

  // Function to generate shareable content
  const generateShareableContent = (food) => {
    const calories = Math.round(food.nutrients.calories);
    const protein = food.nutrients.protein;
    const carbs = food.nutrients.carbs;
    const fats = food.nutrients.fats;
    
    return {
      title: `Nutrition info for ${food.food_name} | अन्ना - Data`,
      text: `I found nutrition info for ${food.food_name} using अन्ना - Data!\n\n• Calories: ${calories} kcal\n• Protein: ${protein}g\n• Carbs: ${carbs}g\n• Fat: ${fats}g\n\n${food.serving_type} (${food.calories_calculated_for}g)`,
      url: window.location.href
    };
  };

  // Function to handle sharing
  const shareFood = async (food) => {
    const shareData = generateShareableContent(food);
    
    try {
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard if Web Share API is not available
        const shareText = `${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        setShareUrl(shareText);
        setShareModalOpen(true);
      }
    } catch (error) {
      console.error("Error sharing food info:", error);
      // Fallback if sharing fails
      try {
        const shareText = `${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        setShareUrl(shareText);
        setShareModalOpen(true);
      } catch (clipboardError) {
        console.error("Error copying to clipboard:", clipboardError);
        // If everything fails, just show the modal with text to copy manually
        setShareUrl(shareData.text);
        setShareModalOpen(true);
      }
    }
  };

  // Function to generate seasonal food recommendations using Gemini
  const generateSeasonalFoods = async (season) => {
    setLoadingSeasonalFoods(true);
    try {
      // Try to load from localStorage first
      const cachedData = localStorage.getItem(`seasonalFoods_${season}`);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        const cacheExpiryMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        // Use cache if it's less than 7 days old
        if (cacheAge < cacheExpiryMs) {
          setSeasonalFoods(parsed.foods);
          setCurrentSeason(season);
          setLoadingSeasonalFoods(false);
          return;
        }
      }
      
      // Call Gemini API for fresh data
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Generate a comprehensive list of 12 seasonal whole foods that are nutritious and typically in season during ${season}.
        
        For each food item, provide:
        1. Food name
        2. Brief description (30-40 words max) highlighting nutritional benefits
        3. A list of 3-4 key nutrients it provides
        4. Best preparation method
        5. Appropriate meal type (breakfast, lunch, dinner, snack)
        6. Food category (vegetable, fruit, grain, protein)
        7. A relevant emoji
        
        Return ONLY a JSON array with objects containing these fields:
        - name: string
        - description: string
        - keyNutrients: array of strings
        - prepMethod: string
        - mealType: string
        - category: string
        - emoji: string emoji character
        
        Make your response concise, accurate, and emphasize health benefits.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean and parse the response
      const cleanedText = text.replace(/```json|```/g, "").trim();
      const generatedFoods = JSON.parse(cleanedText);
      
      // Cache the results in localStorage
      localStorage.setItem(`seasonalFoods_${season}`, JSON.stringify({
        foods: generatedFoods,
        timestamp: Date.now()
      }));
      
      setSeasonalFoods(generatedFoods);
      setCurrentSeason(season);
    } catch (error) {
      console.error("Error generating seasonal foods:", error);
      // Fallback data
      const fallbackFoods = [
        {
          name: "Spinach",
          description: "Leafy green vegetable rich in iron, vitamins, and antioxidants. Helps with energy production and immune function.",
          keyNutrients: ["Iron", "Vitamin K", "Folate", "Magnesium"],
          prepMethod: "Steamed or raw in salads",
          mealType: "lunch",
          category: "vegetable",
          emoji: "🍃"
        },
        {
          name: "Strawberries",
          description: "Sweet berries packed with vitamin C and antioxidants. Great for skin health and immune support.",
          keyNutrients: ["Vitamin C", "Manganese", "Folate", "Potassium"],
          prepMethod: "Fresh, raw",
          mealType: "breakfast",
          category: "fruit",
          emoji: "🍓"
        },
        {
          name: "Asparagus",
          description: "Nutrient-dense spring vegetable with fiber and antioxidants. Supports digestive health.",
          keyNutrients: ["Folate", "Vitamin K", "Fiber", "Antioxidants"],
          prepMethod: "Roasted or steamed",
          mealType: "dinner",
          category: "vegetable",
          emoji: "🌱"
        }
      ];
      
      setSeasonalFoods(fallbackFoods);
      setCurrentSeason(season);
    } finally {
      setLoadingSeasonalFoods(false);
    }
  };

  // Check if we're on client side for localStorage access
  useEffect(() => {
    // Dark theme by default
    document.documentElement.classList.add("dark");

    // Load search history from localStorage
    try {
      const history = localStorage.getItem("searchHistory");
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (e) {
      console.error("Error loading search history from localStorage:", e);
    }

    // Load notifications from localStorage
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter(n => !n.read).length);
      } else {
        // Generate new notifications if none exist
        generateNotifications();
      }
    } catch (e) {
      console.error("Error loading notifications:", e);
    }

    // Initialize diary data
    loadDiaryItems();

    // Initialize seasonal foods
    const season = determineCurrentSeason();
    setCurrentSeason(season);

    // Clean up any camera stream on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [loadDiaryItems]);

  // Generate new notifications when food is saved to diary
  useEffect(() => {
    if (diarySuccess) {
      // Refresh diary items
      loadDiaryItems();
      
      // Wait a bit after saving to diary to generate new notifications
      setTimeout(() => {
        generateNotifications();
      }, 1000);
    }
  }, [diarySuccess, loadDiaryItems]);

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
        const cleanedText = text.replace(/```json|```/g, "").trim();

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
          text: `${food.food_name} provides ${Math.round(
            food.nutrients.protein
          )}g of protein, supporting muscle growth.`,
          icon: "💪",
        },
        {
          text: `With ${Math.round(
            food.nutrients.calories
          )} calories, this represents about ${Math.round(
            (food.nutrients.calories / 2000) * 100
          )}% of daily intake.`,
          icon: "🔥",
        },
        {
          text: `Balance your meal with vegetables to complement the ${Math.round(
            food.nutrients.carbs
          )}g of carbs in this serving.`,
          icon: "🥗",
        },
      ];

      setAiInsights(fallbackInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
      setAiInsights([
        {
          text: "Protein helps build and repair tissues in your body.",
          icon: "💪",
        },
        {
          text: "Maintain balanced meals by combining proteins, carbs, and healthy fats.",
          icon: "⚖️",
        },
        {
          text: "Stay hydrated! Water helps your body process nutrients effectively.",
          icon: "💧",
        },
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
      const cleanedText = text.replace(/```json|```/g, "").trim();

      // Parse the JSON response
      const foodData = JSON.parse(cleanedText);

      // Add missing fields to match our expected structure
      foodData.food_unique_id = `${searchTerm
        .toLowerCase()
        .replace(/\s+/g, "-")}-${Date.now()}`;
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
      const updatedHistory = [searchTerm, ...(searchHistory || [])]
        .filter(
          (item, index, self) => index === self.findIndex((t) => t === item)
        )
        .slice(0, 5);

      setSearchHistory(updatedHistory);

      try {
        localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }

      try {
        // First try the API
        const response = await fetch(
          `/api/searchFood?term=${encodeURIComponent(searchTerm)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            // Add a timeout of 5 seconds
            signal: AbortSignal.timeout(5000),
          }
        );

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
        setError(
          "Sorry, we couldn't find information for that food. Please try another search."
        );
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
              const base64Image = reader.result.split(",")[1];

              // Try with direct Gemini API
              const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
              });

              // Create parts with text prompt and image
              const parts = [
                {
                  text: "What food is in this image? Return only the food name without any additional text, markdown, or explanations.",
                },
                {
                  inlineData: {
                    mimeType: image.type || "image/jpeg",
                    data: base64Image,
                  },
                },
              ];

              const result = await model.generateContent({
                contents: [{ role: "user", parts }],
              });
              const response = await result.response;
              searchTerm = response.text().trim();

              console.log("Gemini identified food:", searchTerm);

              // Now search with identified food name
              await searchFoodAPI(searchTerm);
            } catch (directApiError) {
              console.error("Error with Gemini API:", directApiError);
              setError(
                "Sorry, we couldn't identify the food in your image. Please try a text search instead."
              );
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
          setError(
            "There was a problem processing your image. Please try again or use text search."
          );
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

  // Handle camera capture - Fixed version that checks for browser compatibility
  const handleCameraCapture = async () => {
    if (useCamera) {
      // Turn off camera if it's currently on
      setUseCamera(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    // Check if we're in a browser and if navigator.mediaDevices exists
    if (
      typeof window !== "undefined" &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      try {
        setUseCamera(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;

        // Use setTimeout to ensure the video element exists when we get here
        setTimeout(() => {
          const videoElement = document.getElementById("camera-preview");
          if (videoElement) {
            videoElement.srcObject = stream;
            videoElement
              .play()
              .catch((e) => console.error("Error playing video:", e));
          }
        }, 100);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError(
          "Could not access your camera. Please check your permissions and try again."
        );
        setUseCamera(false);
      }
    } else {
      setError("Camera access is not supported on your device or browser.");
    }
  };

  // Take a photo from the camera stream
  const takePhoto = () => {
    const videoElement = document.getElementById("camera-preview");
    if (!videoElement) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    if (canvas.width === 0 || canvas.height === 0) {
      console.error("Video dimensions are not available yet");
      return;
    }

    canvas.getContext("2d").drawImage(videoElement, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create blob from canvas");
        return;
      }

      setImage(blob);
      setImagePreview(canvas.toDataURL("image/jpeg"));

      // Close camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setUseCamera(false);

      // Auto-search with the captured photo
      setTimeout(() => handleSearch(), 500);
    }, "image/jpeg");
  };

  // Show detailed analysis for a selected food
  const showFoodDetails = (food) => {
    setSelectedFood(food);
    generateInsights(food);

    // Update daily nutrition
    setDailyNutrition((prev) => ({
      calories: {
        ...prev.calories,
        consumed: Math.min(
          prev.calories.consumed + food.nutrients.calories,
          prev.calories.goal
        ),
      },
      protein: {
        ...prev.protein,
        consumed: Math.min(
          prev.protein.consumed + food.nutrients.protein,
          prev.protein.goal
        ),
      },
      carbs: {
        ...prev.carbs,
        consumed: Math.min(
          prev.carbs.consumed + food.nutrients.carbs,
          prev.carbs.goal
        ),
      },
      fat: {
        ...prev.fat,
        consumed: Math.min(
          prev.fat.consumed + food.nutrients.fats,
          prev.fat.goal
        ),
      },
    }));
  };

  // Function to get food emoji based on name
  const getFoodEmoji = (foodName) => {
    const name = foodName.toLowerCase();
    if (name.includes("pizza")) return "🍕";
    if (name.includes("burger")) return "🍔";
    if (name.includes("chicken")) return "🍗";
    if (name.includes("salad")) return "🥗";
    if (name.includes("paratha")) return "🫓";
    if (name.includes("chow") || name.includes("noodle")) return "🍜";
    if (name.includes("bread") || name.includes("naan")) return "🍞";
    if (name.includes("curry")) return "🍲";
    if (name.includes("rice")) return "🍚";
    if (name.includes("pasta")) return "🍝";
    if (name.includes("cake")) return "🍰";
    if (name.includes("ice cream")) return "🍦";
    if (name.includes("sandwich")) return "🥪";
    if (name.includes("fruit")) return "🍎";
    if (name.includes("egg")) return "🥚";
    return "🍽️";
  };

  // Function to save food to diary - Fixed implementation
  const saveToFoodDiary = async (mealType = 'snack') => {
    try {
      setSavingToDiary(true);
      
      // Always store in localStorage first as a failsafe
      const savedFoods = JSON.parse(localStorage.getItem('savedFoods') || '[]');
      const newEntry = {
        food: selectedFood,
        mealType,
        date: new Date().toISOString()
      };
      
      savedFoods.push(newEntry);
      localStorage.setItem('savedFoods', JSON.stringify(savedFoods));
      
      // If user is authenticated, also try to save to the backend
      if (session) {
        try {
          await fetch('/api/diary/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newEntry),
          });
          
          console.log('Food saved to backend diary');
        } catch (apiError) {
          console.error('Error saving to backend diary, but saved to localStorage:', apiError);
        }
      }
      
      // Show success message regardless of API success, since we saved to localStorage
      setDiarySuccess(true);
      setTimeout(() => {
        setDiarySuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving to diary:', error);
      setError(`Failed to save to diary: ${error.message}`);
    } finally {
      setSavingToDiary(false);
    }
  };

  // Helper functions for notifications
  function getPriorityColor(priority) {
    switch(priority?.toLowerCase()) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-emerald-400';
      default: return 'text-blue-400';
    }
  }

  function formatTimeAgo(timestamp) {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const seconds = Math.round((now - date) / 1000);
      
      if (seconds < 60) return 'just now';
      
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      
      const days = Math.round(hours / 24);
      if (days === 1) return 'yesterday';
      if (days < 7) return `${days}d ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return 'unknown time';
    }
  }

  return (
    <AuthCheck>
      <main className="min-h-screen bg-gradient-to-b from-[#070B14] via-[#0b1120] to-[#0A0E1A] text-white">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
        
        {/* Animated glowing orb */}
        <div className="fixed top-1/4 -right-28 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div className="fixed top-3/4 -left-28 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>

        {/* Navbar */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-black/80 via-black/70 to-black/80 border-b border-slate-800/60 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="font-bold">
                  <span className="text-2xl md:text-3xl bg-gradient-to-r from-indigo-400 to-purple-600 text-transparent bg-clip-text font-devanagari">
                    अन्ना - Data
                  </span>
                </h1>
              </div>

              <div className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => setActiveSection("home")}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === "home"
                      ? "bg-slate-800/80 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Home
                </button>
                <button
                  onClick={() => router.push("/fitness")}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                >
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Fitness
                </button>
                <button
                  onClick={() => router.push("/recipe")}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                >
                  <ChefHat className="mr-2 h-4 w-4" />
                  Recipes
                </button>
                <button
                  onClick={() => setShowDiaryView(true)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Food Diary
                </button>

                {/* Notification bell */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="flex items-center px-2 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors relative"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-80 bg-slate-900/90 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl py-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-slate-700/50 flex justify-between items-center">
                        <h4 className="font-medium text-white">Notifications</h4>
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-900/30"
                        >
                          Mark all as read
                        </button>
                      </div>
                      
                      {isLoadingNotifications ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : notifications.length > 0 ? (
                        <>
                          <div className="max-h-72 overflow-y-auto">
                            {notifications.map(notification => (
                              <div 
                                key={notification.id} 
                                onClick={() => markNotificationAsRead(notification.id)}
                                className={`px-3 py-2 hover:bg-slate-800/50 border-b border-slate-700/30 cursor-pointer ${!notification.read ? 'bg-slate-800/20' : ''}`}
                              >
                                <div className="flex gap-3">
                                  <div className="mt-1 flex-shrink-0 text-lg">
                                    {notification.icon || "📝"}
                                  </div>
                                  <div>
                                    <p className={`text-sm ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                                      {notification.message}
                                    </p>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                        {notification.category}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        {formatTimeAgo(notification.timestamp)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="px-3 py-2 text-center border-t border-slate-700/50">
                            <button 
                              onClick={() => {
                                setShowNotifications(false);
                                router.push('/notifications');
                              }}
                              className="text-xs text-indigo-400 hover:text-indigo-300"
                            >
                              View all notifications
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="px-3 py-6 text-center">
                          <p className="text-slate-400 text-sm">No notifications yet</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* User profile section with login status */}
                <div className="relative group">
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                  >
                    {session ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 mr-2 flex items-center justify-center text-xs font-bold overflow-hidden">
                          {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                        </div>
                        <span className="max-w-[80px] truncate">
                          {session.user?.name || session.user?.email?.split('@')[0] || 'User'}
                        </span>
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                className="md:hidden text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    ></path>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-900/90 backdrop-blur-lg">
                <button
                  onClick={() => {
                    setActiveSection("home");
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-slate-800/80"
                >
                  <HomeIcon className="mr-3 h-5 w-5" />
                  Home
                </button>
                <button
                  onClick={() => {
                    router.push("/fitness");
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-slate-800/80"
                >
                  <Dumbbell className="mr-3 h-5 w-5" />
                  Fitness
                </button>
                <button
                  onClick={() => {
                    router.push("/recipe");
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-slate-800/80"
                >
                  <ChefHat className="mr-3 h-5 w-5" />
                  Recipes
                </button>
                <button
                  onClick={() => {
                    setShowDiaryView(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-slate-800/80"
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  Food Diary
                </button>
                <button
                  onClick={() => {
                    router.push("/profile");
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-white hover:bg-slate-800/80"
                >
                  {session ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 mr-3 flex items-center justify-center text-xs font-bold">
                        {session.user?.name?.charAt(0) || 'U'}
                      </div>
                      Profile
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-3 h-5 w-5" />
                      Sign In
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </nav>

        <div className="container mx-auto px-4 pt-8 pb-24">
          {/* Hero Section */}
          <div className="text-center mb-12 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-24 bg-indigo-500/20 blur-3xl rounded-full -z-10"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative inline-block"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 rounded-full blur-xl opacity-75"></div>
              <h1 className="relative text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400 mb-4 px-2">
                <span className="font-devanagari">अन्ना - Data</span>
              </h1>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl md:text-3xl font-medium bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text"
            >
              Your Nutritional Intelligence Assistant
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-6 text-lg md:text-xl text-slate-300 max-w-3xl mx-auto"
            >
              Discover the nutritional content of any food by searching or
              uploading a photo. Get AI-powered insights tailored to your health
              goals.
            </motion.p>
          </div>

          {/* Daily Nutrition Summary */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BarChart3 className="mr-2 h-6 w-6 text-indigo-500" />
              Today's Nutrition
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 shadow-lg hover:border-slate-600 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-2">
                      <Flame className="h-4 w-4" />
                    </div>
                    <p className="text-white font-medium">Calories</p>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {dailyNutrition.calories.consumed} /{" "}
                    {dailyNutrition.calories.goal}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"
                    style={{
                      width: `${
                        (dailyNutrition.calories.consumed /
                          dailyNutrition.calories.goal) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 shadow-lg hover:border-slate-600 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center mr-2">
                      <Dumbbell className="h-4 w-4" />
                    </div>
                    <p className="text-white font-medium">Protein</p>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {dailyNutrition.protein.consumed}g /{" "}
                    {dailyNutrition.protein.goal}g
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
                    style={{
                      width: `${
                        (dailyNutrition.protein.consumed /
                          dailyNutrition.protein.goal) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 shadow-lg hover:border-slate-600 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-center mr-2">
                      <Apple className="h-4 w-4" />
                    </div>
                    <p className="text-white font-medium">Carbs</p>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {dailyNutrition.carbs.consumed}g /{" "}
                    {dailyNutrition.carbs.goal}g
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-600 to-emerald-600"
                    style={{
                      width: `${
                        (dailyNutrition.carbs.consumed /
                          dailyNutrition.carbs.goal) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 shadow-lg hover:border-slate-600 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-r from-amber-600 to-yellow-600 flex items-center justify-center mr-2">
                      <Heart className="h-4 w-4" />
                    </div>
                    <p className="text-white font-medium">Fat</p>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {dailyNutrition.fat.consumed}g / {dailyNutrition.fat.goal}g
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-yellow-600"
                    style={{
                      width: `${
                        (dailyNutrition.fat.consumed /
                          dailyNutrition.fat.goal) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
              {/* Search Tabs */}
              <div className="flex border-b border-slate-700/50">
                <button
                  className={`flex items-center px-6 py-4 ${
                    !image 
                      ? "bg-gradient-to-r from-indigo-900/60 to-purple-900/60 text-white" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800/30 transition-colors"
                  }`}
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </button>
                <button
                  className={`flex items-center px-6 py-4 ${
                    image 
                      ? "bg-gradient-to-r from-indigo-900/60 to-purple-900/60 text-white" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800/30 transition-colors"
                  }`}
                  onClick={() => document.getElementById("food-image").click()}
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
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full bg-gradient-to-br from-slate-900/80 to-black/60 border border-slate-700/50 rounded-full py-4 pl-6 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg"
                        placeholder="Search for any food..."
                      />
                      <button
                        onClick={handleSearch}
                        className="absolute right-1 top-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-3 hover:opacity-90 shadow-lg transition-transform hover:scale-105"
                      >
                        <Search className="h-5 w-5 text-white" />
                      </button>
                    </div>

                    {/* Search History */}
                    {searchHistory.length > 0 && !selectedFood && !loading && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        <span className="text-slate-400">Recent:</span>
                        {searchHistory.map((term, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setQuery(term);
                              searchFoodAPI(term);
                            }}
                            className="px-4 py-1 bg-gradient-to-r from-slate-800/60 to-slate-900/60 hover:from-indigo-900/40 hover:to-purple-900/40 border border-slate-700/50 hover:border-indigo-500/50 rounded-full text-white text-sm transition-all shadow-md"
                          >
                            {term}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-slate-400 mb-3">OR</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        <motion.button
                          whileHover={{ y: -2, scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            document.getElementById("food-image").click()
                          }
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-800/60 to-slate-900/60 hover:from-indigo-900/40 hover:to-purple-900/40 border border-slate-700/50 hover:border-indigo-500/50 rounded-full text-white text-sm transition-all shadow-md"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -2, scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCameraCapture}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-800/60 to-slate-900/60 hover:from-indigo-900/40 hover:to-purple-900/40 border border-slate-700/50 hover:border-indigo-500/50 rounded-full text-white text-sm transition-all shadow-md"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Take Photo
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative border-3 border-dashed border-indigo-500/30 rounded-xl overflow-hidden shadow-lg">
                      <img
                        src={imagePreview}
                        alt="Food"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="text-center p-4">
                          <h3 className="text-lg font-medium text-white mb-2">
                            Analyzing Image
                          </h3>
                          <p className="text-slate-300 mb-4">
                            AI is identifying your food
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setImage(null);
                              setImagePreview(null);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-slate-800/80 to-slate-900/80 hover:from-indigo-900/40 hover:to-purple-900/40 border border-slate-700/50 hover:border-indigo-500/50 rounded-full text-white text-sm transition-all shadow-lg"
                          >
                            Remove Image
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSearch}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-xl text-white font-medium hover:opacity-90 shadow-lg transition-all"
                    >
                      Analyze Now
                    </motion.button>
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
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-900/30 to-rose-900/30 backdrop-blur-lg border border-red-500/30 text-white rounded-lg p-4 mb-6 shadow-lg"
            >
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-400 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p>{error}</p>
              </div>
            </motion.div>
          )}

          {/* Camera Modal */}
          {useCamera && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-900 to-black rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-700/50"
              >
                <div className="p-4 flex justify-between items-center border-b border-slate-700/50 bg-black/50">
                  <h3 className="text-lg font-medium text-white">
                    Take a photo of your food
                  </h3>
                  <button
                    onClick={handleCameraCapture}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="relative bg-black">
                  <video
                    id="camera-preview"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-72 sm:h-96 object-cover"
                  />
                  <button
                    onClick={takePhoto}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
                  >
                    <div className="w-10 h-10 border-4 border-slate-900 rounded-full relative">
                      <div className="absolute inset-0 m-1 bg-slate-900 rounded-full"></div>
                    </div>
                  </button>
                </div>

                <div className="p-4 text-center">
                  <p className="text-slate-300 text-sm">
                    Position your food clearly in the frame for the best results
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Empty Search Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-700/50"
              >
                <div className="text-center mb-6">
                  <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-900/60 text-indigo-400">
                    <Info className="h-8 w-8" />
                  </span>
                </div>
                <h3 className="text-xl font-medium text-white mb-3 text-center">
                  Search Input Required
                </h3>
                <p className="text-slate-300 mb-6 text-center">
                  Please enter a food name or upload a food image to search.
                </p>
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Got it
                  </motion.button>
                </div>
              </motion.div>
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
                className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden mb-12 shadow-2xl"
              >
                <div className="relative h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
                  {/* Animated particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute rounded-full bg-white/20"
                        style={{
                          width: `${Math.random() * 10 + 5}px`,
                          height: `${Math.random() * 10 + 5}px`,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animation: `float ${Math.random() * 10 + 10}s linear infinite`
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="absolute top-4 right-4 bg-black/30 backdrop-blur-md hover:bg-black/50 p-2 rounded-full text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="absolute -bottom-12 left-8">
                    <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-xl border border-slate-700/50 w-24 h-24 rounded-xl flex items-center justify-center shadow-xl">
                      <span className="text-4xl">
                        {getFoodEmoji(selectedFood.food_name)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-16 px-8 pb-8">
                  <h2 className="text-3xl font-bold text-white mb-1">
                    {selectedFood.food_name}
                  </h2>
                  <p className="text-slate-300 mb-6">
                    {selectedFood.serving_type} (
                    {selectedFood.calories_calculated_for}g)
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="mr-2 h-5 w-5 text-indigo-500" />
                        Nutrition Overview
                      </h3>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <NutritionCard
                          nutrient="Calories"
                          value={`${Math.round(
                            selectedFood.nutrients.calories
                          )} kcal`}
                          color="bg-gradient-to-r from-indigo-600 to-purple-600"
                          icon="🔥"
                        />

                        <NutritionCard
                          nutrient="Protein"
                          value={`${selectedFood.nutrients.protein}g`}
                          color="bg-gradient-to-r from-blue-600 to-cyan-600"
                          percentage={Math.round(
                            ((selectedFood.nutrients.protein * 4) /
                              selectedFood.nutrients.calories) *
                              100
                          )}
                          icon="💪"
                        />

                        <NutritionCard
                          nutrient="Carbs"
                          value={`${selectedFood.nutrients.carbs}g`}
                          color="bg-gradient-to-r from-teal-600 to-emerald-600"
                          percentage={Math.round(
                            ((selectedFood.nutrients.carbs * 4) /
                              selectedFood.nutrients.calories) *
                              100
                          )}
                          icon="🌾"
                        />

                        <NutritionCard
                          nutrient="Fat"
                          value={`${selectedFood.nutrients.fats}g`}
                          color="bg-gradient-to-r from-amber-600 to-yellow-600"
                          percentage={Math.round(
                            ((selectedFood.nutrients.fats * 9) /
                              selectedFood.nutrients.calories) *
                              100
                          )}
                          icon="🧈"
                        />
                      </div>

                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-5 mb-6 shadow-lg
                        hover:border-slate-600 hover:shadow-xl transition-all"
                      >
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <BarChart3 className="mr-2 h-5 w-5 text-indigo-500" />
                          Calorie Distribution
                        </h4>

                        <div className="h-10 w-full flex rounded-lg overflow-hidden mb-2 bg-slate-800/70">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-xs font-medium text-white transition-all"
                            style={{
                              width: `${Math.round(
                                ((selectedFood.nutrients.protein * 4) /
                                  selectedFood.nutrients.calories) *
                                  100
                              )}%`,
                            }}
                          >
                            {Math.round(
                              ((selectedFood.nutrients.protein * 4) /
                                selectedFood.nutrients.calories) *
                                100
                            )}
                            %
                          </div>

                          <div
                            className="bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-center text-xs font-medium text-white transition-all"
                            style={{
                              width: `${Math.round(
                                ((selectedFood.nutrients.carbs * 4) /
                                  selectedFood.nutrients.calories) *
                                  100
                              )}%`,
                            }}
                          >
                            {Math.round(
                              ((selectedFood.nutrients.carbs * 4) /
                                selectedFood.nutrients.calories) *
                                100
                            )}
                            %
                          </div>

                          <div
                            className="bg-gradient-to-r from-amber-600 to-yellow-600 flex items-center justify-center text-xs font-medium text-white transition-all"
                            style={{
                              width: `${Math.round(
                                ((selectedFood.nutrients.fats * 9) /
                                  selectedFood.nutrients.calories) *
                                  100
                              )}%`,
                            }}
                          >
                            {Math.round(
                              ((selectedFood.nutrients.fats * 9) /
                                selectedFood.nutrients.calories) *
                                100
                            )}
                            %
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-slate-300">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 mr-1"></div>
                            <span>Protein</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 mr-1"></div>
                            <span>Carbs</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 mr-1"></div>
                            <span>Fat</span>
                          </div>
                        </div>
                      </motion.div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowFullAnalysis(true)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-xl text-white flex items-center justify-center hover:opacity-90 transition-all shadow-lg"
                      >
                        <Info className="mr-2 h-5 w-5" />
                        View Full Nutrition Facts
                      </motion.button>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Sparkles className="mr-2 h-5 w-5 text-indigo-500" />
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
                            <div className="relative w-12 h-12">
                              <div className="absolute inset-0 rounded-full border-4 border-slate-700/50"></div>
                              <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        )}

                        <motion.div 
                          whileHover={{ y: -5 }}
                          className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-5 shadow-lg hover:border-slate-600 hover:shadow-xl transition-all"
                        >
                          <h4 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                            <Heart className="h-5 w-5 text-indigo-500" />
                            Diet Compatibility
                          </h4>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-white">Vegetarian</span>
                              <div
                                className={`px-3 py-1 rounded-full text-sm ${
                                  selectedFood.food_name
                                    .toLowerCase()
                                    .includes("chicken") ||
                                  selectedFood.food_name
                                    .toLowerCase()
                                    .includes("beef") ||
                                  selectedFood.food_name
                                    .toLowerCase()
                                    .includes("meat")
                                    ? "bg-red-900/40 text-red-300 border border-red-800/30"
                                    : "bg-emerald-900/40 text-emerald-300 border border-emerald-800/30"
                                }`}
                              >
                                {selectedFood.food_name
                                  .toLowerCase()
                                  .includes("chicken") ||
                                selectedFood.food_name
                                  .toLowerCase()
                                  .includes("beef") ||
                                selectedFood.food_name
                                  .toLowerCase()
                                  .includes("meat")
                                  ? "Not Suitable"
                                  : "Suitable"}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-white">Vegan</span>
                              <div
                                className={`px-3 py-1 rounded-full text-sm ${
                                  selectedFood.food_name
                                    .toLowerCase()
                                    .includes("chicken") ||
                                  selectedFood.food_name
                                    .toLowerCase()
                                    .includes("cheese") ||
                                  selectedFood.food_name
                                    .toLowerCase()
                                    .includes("butter") ||
                                  selectedFood.food_name
                                    .toLowerCase()
                                    .includes("meat")
                                    ? "bg-red-900/40 text-red-300 border border-red-800/30"
                                    : "bg-emerald-900/40 text-emerald-300 border border-emerald-800/30"
                                }`}
                              >
                                {selectedFood.food_name
                                  .toLowerCase()
                                  .includes("chicken") ||
                                selectedFood.food_name
                                  .toLowerCase()
                                  .includes("cheese") ||
                                selectedFood.food_name
                                  .toLowerCase()
                                  .includes("butter") ||
                                selectedFood.food_name
                                  .toLowerCase()
                                  .includes("meat")
                                  ? "Not Suitable"
                                  : "Suitable"}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-white">Keto</span>
                              <div
                                className={`px-3 py-1 rounded-full text-sm ${
                                  selectedFood.nutrients.carbs < 15
                                    ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800/30"
                                    : "bg-red-900/40 text-red-300 border border-red-800/30"
                                }`}
                              >
                                {selectedFood.nutrients.carbs < 15
                                  ? "Suitable"
                                  : "Not Suitable"}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative overflow-hidden py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 rounded-xl text-white flex items-center justify-center hover:opacity-90 transition-all shadow-lg"
                          onClick={() => {
                            if (!session) {
                              // Redirect to sign-in if not authenticated
                              router.push('/api/auth/signin');
                            } else {
                              setMealTypeDialogOpen(true);
                            }
                          }}
                          disabled={savingToDiary}
                        >
                          {savingToDiary ? (
                            <>
                              <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                              Saving...
                            </>
                          ) : diarySuccess ? (
                            <>
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 bg-emerald-600 flex items-center justify-center"
                              >
                                <Check className="mr-1 h-5 w-5" />
                                Saved!
                              </motion.div>
                              <Calendar className="mr-2 h-5 w-5" />
                              {session ? 'Save to Diary' : 'Sign in to Save'}
                            </>
                          ) : (
                            <>
                              <Calendar className="mr-2 h-5 w-5" />
                              {session ? 'Save to Diary' : 'Sign in to Save'}
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-xl text-white flex items-center justify-center hover:opacity-90 transition-all shadow-lg"
                          onClick={() => {
                            router.push(
                              `/recipe?query=${encodeURIComponent(
                                selectedFood.food_name
                              )}`
                            );
                          }}
                        >
                          <ChefHat className="mr-2 h-5 w-5" />
                          Find Recipes
                        </motion.button>
                      </div>
                      
                      {/* Social share button */}
                      <div className="mt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => shareFood(selectedFood)}
                          className="w-full py-2 px-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-white flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-700/50"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share This Food Info
                        </motion.button>
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
                <Utensils className="mr-2 h-6 w-6 text-indigo-500" />
                Search Results ({results.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((food) => (
                  <motion.div
                    key={food.food_unique_id}
                    whileHover={{
                      y: -8,
                      scale: 1.02,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    }}
                    className="group bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-indigo-500/40"
                    onClick={() => showFoodDetails(food)}
                  >
                    <div className="h-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 flex items-center justify-center relative overflow-hidden">
                      {/* Animated particles */}
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(10)].map((_, i) => (
                          <div 
                            key={i}
                            className="absolute rounded-full bg-white/20"
                            style={{
                              width: `${Math.random() * 8 + 4}px`,
                              height: `${Math.random() * 8 + 4}px`,
                              top: `${Math.random() * 100}%`,
                              left: `${Math.random() * 100}%`,
                              animation: `float ${Math.random() * 8 + 8}s linear infinite`
                            }}
                          ></div>
                        ))}
                      </div>
                      
                      <span className="text-4xl transform transition-transform group-hover:scale-125">
                        {getFoodEmoji(food.food_name)}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-medium text-white mb-1 line-clamp-2">
                        {food.food_name}
                      </h3>
                      <p className="text-slate-300 mb-4">
                        {food.serving_type} ({food.calories_calculated_for}g)
                      </p>

                      <div className="bg-gradient-to-br from-slate-900/50 to-black/40 rounded-lg p-3 mb-4 border border-slate-700/40">
                        <div className="flex justify-between mb-1">
                          <span className="text-white font-medium">
                            Calories
                          </span>
                          <span className="text-white font-bold">
                            {Math.round(food.nutrients.calories)} kcal
                          </span>
                        </div>

                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"
                            style={{
                              width: `${Math.min(
                                Math.round(
                                  (food.nutrients.calories / 2000) * 100
                                ),
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-gradient-to-br from-slate-900/50 to-black/40 p-2 rounded-lg text-center border border-slate-700/40">
                          <div className="text-blue-400 font-medium text-xs">
                            Protein
                          </div>
                          <div className="text-white font-bold">
                            {food.nutrients.protein}g
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900/50 to-black/40 p-2 rounded-lg text-center border border-slate-700/40">
                          <div className="text-emerald-400 font-medium text-xs">
                            Carbs
                          </div>
                          <div className="text-white font-bold">
                            {food.nutrients.carbs}g
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900/50 to-black/40 p-2 rounded-lg text-center border border-slate-700/40">
                          <div className="text-amber-400 font-medium text-xs">
                            Fat
                          </div>
                          <div className="text-white font-bold">
                            {food.nutrients.fats}g
                          </div>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-2 text-sm bg-gradient-to-r from-indigo-900/50 to-purple-900/50 hover:from-indigo-600/80 hover:to-purple-600/80 text-white rounded-lg transition-colors flex items-center justify-center border border-slate-700/50 hover:border-indigo-500/50 shadow-md"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        View Details
                      </motion.button>
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
                  Discover More with{" "}
                  <span className="font-devanagari bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">अन्ना - Data</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Fitness Card */}
                  <motion.div
                    whileHover={{
                      y: -10,
                      scale: 1.02,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    }}
                    className="group bg-gradient-to-br from-teal-900 to-emerald-900 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer relative"
                    onClick={() => router.push("/fitness")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50 opacity-70 group-hover:opacity-90 transition-opacity"></div>
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                    <div className="relative z-10 p-6">
                      <div className="w-16 h-16 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-teal-600/30 shadow-lg">
                        <Dumbbell className="h-8 w-8 text-white" />
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-2">
                        Fitness Tracking
                      </h3>
                      <p className="text-teal-100 mb-6 group-hover:text-white transition-colors">
                        Track your workouts and monitor your progress toward
                        your health goals.
                      </p>

                      <div className="flex justify-end">
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          className="text-white text-sm flex items-center"
                        >
                          Explore
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Recipe Card */}
                  <motion.div
                    whileHover={{
                      y: -10,
                      scale: 1.02,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    }}
                    className="group bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer relative"
                    onClick={() => router.push("/recipe")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50 opacity-70 group-hover:opacity-90 transition-opacity"></div>
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                    <div className="relative z-10 p-6">
                      <div className="w-16 h-16 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-indigo-500/30 shadow-lg">
                        <ChefHat className="h-8 w-8 text-white" />
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-2">
                        Healthy Recipes
                      </h3>
                      <p className="text-indigo-100 mb-6 group-hover:text-white transition-colors">
                        Discover delicious recipes tailored to your nutritional
                        preferences.
                      </p>

                      <div className="flex justify-end">
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          className="text-white text-sm flex items-center"
                        >
                          Explore
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Nutrition Plan Card */}
                  <motion.div
                    whileHover={{
                      y: -10,
                      scale: 1.02,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    }}
                    className="group bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer relative"
                    onClick={() => router.push("/profile")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50 opacity-70 group-hover:opacity-90 transition-opacity"></div>
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                    <div className="relative z-10 p-6">
                      <div className="w-16 h-16 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/30 shadow-lg">
                        <User className="h-8 w-8 text-white" />
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-2">
                        Personalized Plan
                      </h3>
                      <p className="text-blue-100 mb-6 group-hover:text-white transition-colors">
                        Create a customized nutrition plan aligned with your
                        health goals.
                      </p>

                      <div className="flex justify-end">
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          className="text-white text-sm flex items-center"
                        >
                          Explore
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Features Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  Features That Make{" "}
                  <span className="font-devanagari bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">अन्ना - Data</span> Special
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
                  <TrendingUp className="mr-2 h-6 w-6 text-indigo-500" />
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
                      whileHover={{
                        y: -8,
                        scale: 1.05,
                        boxShadow:
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-indigo-500/40"
                      onClick={() => {
                        setQuery(food.name);
                        searchFoodAPI(food.name);
                      }}
                    >
                      <div className="p-5 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg">
                          {food.emoji}
                        </div>
                        <h3 className="font-medium text-white mb-1">
                          {food.name}
                        </h3>
                        <p className="text-sm text-slate-300">
                          {food.calories} calories
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* New Seasonal Recommendations Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="mt-16"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Award className="mr-2 h-6 w-6 text-indigo-500" />
                  Seasonal Recommendations
                </h2>
                
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-6 shadow-xl">
                  {/* Animated particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(15)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute rounded-full bg-white/10"
                        style={{
                          width: `${Math.random() * 8 + 3}px`,
                          height: `${Math.random() * 8 + 3}px`,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animation: `float ${Math.random() * 10 + 5}s linear infinite`
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-4">Spring Superfoods to Boost Your Health</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { name: "Fresh Berries", benefit: "Rich in antioxidants and vitamins", emoji: "🫐", query: "mixed berries" },
                        { name: "Leafy Greens", benefit: "High in fiber and essential nutrients", emoji: "🥬", query: "spinach" },
                        { name: "Asparagus", benefit: "Excellent source of folate and vitamin K", emoji: "🌱", query: "asparagus" },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ y: -5, scale: 1.03 }}
                          className="bg-black/30 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center text-center cursor-pointer border border-indigo-500/20 hover:border-indigo-500/50 transition-all"
                          onClick={() => {
                            setQuery(item.query);
                            searchFoodAPI(item.query);
                          }}
                        >
                          <span className="text-4xl mb-3">{item.emoji}</span>
                          <h4 className="font-medium text-white mb-1">{item.name}</h4>
                          <p className="text-sm text-slate-300">{item.benefit}</p>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="mt-6 text-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          generateSeasonalFoods(currentSeason);
                          setShowSeasonalFoods(true);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all flex items-center mx-auto"
                      >
                        <span>View All Seasonal Foods</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Meal Type Selection Dialog */}
          {mealTypeDialogOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                  Select Meal Type
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {["breakfast", "lunch", "dinner", "snack"].map((meal) => (
                    <motion.button
                      key={meal}
                      onClick={() => {
                        saveToFoodDiary(meal);
                        setMealTypeDialogOpen(false);
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 hover:border-indigo-500/50 rounded-lg text-white capitalize hover:shadow-lg transition-all"
                    >
                      {meal}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ backgroundColor: "rgba(60, 60, 70, 0.5)" }}
                  onClick={() => setMealTypeDialogOpen(false)}
                  className="w-full mt-4 p-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800/50 transition-colors"
                >
                  Cancel
                </motion.button>
              </motion.div>
            </div>
          )}

          {/* Full Analysis Modal */}
          {showFullAnalysis && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-slate-900/80 to-black/70 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-700/50 overflow-hidden"
                style={{ maxHeight: "85vh" }}
              >
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    Full Nutrition Analysis
                  </h2>
                  <button
                    onClick={() => setShowFullAnalysis(false)}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div
                  className="overflow-y-auto p-6"
                  style={{ maxHeight: "calc(85vh - 70px)" }}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-xl hover:border-slate-600"
                      >
                        <div className="text-center mb-4">
                          <span className="text-4xl">
                            {getFoodEmoji(selectedFood.food_name)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white text-center mb-1">
                          {selectedFood.food_name}
                        </h3>
                        <p className="text-slate-300 text-center mb-4">
                          {selectedFood.serving_type} (
                          {selectedFood.calories_calculated_for}g)
                        </p>

                        <div className="bg-gradient-to-br from-slate-900/80 to-black/40 rounded-lg p-4 mb-4 border border-slate-700/50">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">
                              Calories
                            </span>
                            <span className="text-2xl font-bold text-white">
                              {Math.round(selectedFood.nutrients.calories)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"
                              style={{
                                width: `${Math.min(
                                  Math.round(
                                    (selectedFood.nutrients.calories / 2000) *
                                      100
                                  ),
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-end mt-1">
                            <span className="text-xs text-slate-400">
                              {Math.round(
                                (selectedFood.nutrients.calories / 2000) * 100
                              )}
                              % of 2000 kcal daily value
                            </span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900/80 to-black/40 rounded-lg p-4 border border-slate-700/50">
                          <h4 className="text-lg font-semibold text-white mb-3">
                            Quick Facts
                          </h4>
                          <ul className="space-y-2 text-slate-300">
                            <li className="flex items-center">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 mr-2 flex items-center justify-center text-white text-xs">
                                ✓
                              </div>
                              <span>
                                {Math.round(
                                  ((selectedFood.nutrients.protein * 4) /
                                    selectedFood.nutrients.calories) *
                                    100
                                )}
                                % of calories from protein
                              </span>
                            </li>
                            <li className="flex items-center">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 mr-2 flex items-center justify-center text-white text-xs">
                                ✓
                              </div>
                              <span>
                                {Math.round(
                                  ((selectedFood.nutrients.carbs * 4) /
                                    selectedFood.nutrients.calories) *
                                    100
                                )}
                                % of calories from carbs
                              </span>
                            </li>
                            <li className="flex items-center">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 mr-2 flex items-center justify-center text-white text-xs">
                                ✓
                              </div>
                              <span>
                                {Math.round(
                                  ((selectedFood.nutrients.fats * 9) /
                                    selectedFood.nutrients.calories) *
                                    100
                                )}
                                % of calories from fat
                              </span>
                            </li>
                          </ul>
                        </div>
                      </motion.div>
                    </div>

                    <div className="w-full md:w-2/3">
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-xl hover:border-slate-600"
                      >
                        <h3 className="text-xl font-bold border-b-2 border-indigo-500/30 pb-2 mb-4 text-white">
                          Nutrition Facts
                        </h3>
                        <p className="text-sm mb-2 text-slate-400">
                          Serving Size: {selectedFood.serving_type} (
                          {selectedFood.calories_calculated_for}g)
                        </p>

                        <div className="border-t-8 border-b-4 border-slate-300/30 py-2 mb-2">
                          <div className="flex justify-between">
                            <span className="font-bold text-xl text-white">
                              Calories
                            </span>
                            <span className="font-bold text-xl text-white">
                              {Math.round(selectedFood.nutrients.calories)}
                            </span>
                          </div>
                        </div>

                        {/* Detailed Nutrient Breakdown */}
                        <div className="border-b border-slate-700/50 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">
                              Total Fat
                            </span>
                            <span className="text-white">
                              {selectedFood.nutrients.fats}g
                            </span>
                          </div>
                          <div className="pl-4 text-sm text-slate-400">
                            <div className="flex justify-between">
                              <span>Saturated Fat</span>
                              <span>
                                {(selectedFood.nutrients.fats * 0.3).toFixed(1)}
                                g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Trans Fat</span>
                              <span>0g</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Polyunsaturated Fat</span>
                              <span>
                                {(selectedFood.nutrients.fats * 0.25).toFixed(
                                  1
                                )}
                                g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Monounsaturated Fat</span>
                              <span>
                                {(selectedFood.nutrients.fats * 0.45).toFixed(
                                  1
                                )}
                                g
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-b border-slate-700/50 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">
                              Cholesterol
                            </span>
                            <span className="text-white">
                              {Math.round(selectedFood.nutrients.protein * 2.5)}
                              mg
                            </span>
                          </div>
                        </div>

                        <div className="border-b border-slate-700/50 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">Sodium</span>
                            <span className="text-white">
                              {Math.round(
                                selectedFood.calories_calculated_for * 5
                              )}
                              mg
                            </span>
                          </div>
                        </div>

                        <div className="border-b border-slate-700/50 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">
                              Total Carbohydrate
                            </span>
                            <span className="text-white">
                              {selectedFood.nutrients.carbs}g
                            </span>
                          </div>
                          <div className="pl-4 text-sm text-slate-400">
                            <div className="flex justify-between">
                              <span>Dietary Fiber</span>
                              <span>
                                {(selectedFood.nutrients.carbs * 0.1).toFixed(
                                  1
                                )}
                                g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sugars</span>
                              <span>
                                {(selectedFood.nutrients.carbs * 0.2).toFixed(
                                  1
                                )}
                                g
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-b border-slate-700/50 py-1 mb-4">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">
                              Protein
                            </span>
                            <span className="text-white">
                              {selectedFood.nutrients.protein}g
                            </span>
                          </div>
                        </div>

                        {/* Vitamins and Minerals */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="border-b border-slate-700/50 py-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  Vitamin D
                                </span>
                                <span className="text-white">-</span>
                              </div>
                            </div>

                            <div className="border-b border-slate-700/50 py-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Calcium</span>
                                <span className="text-white">
                                  {Math.round(
                                    selectedFood.calories_calculated_for * 0.5
                                  )}
                                  mg
                                </span>
                              </div>
                            </div>

                            <div className="border-b border-slate-700/50 py-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Iron</span>
                                <span className="text-white">
                                  {(
                                    selectedFood.calories_calculated_for * 0.01
                                  ).toFixed(2)}
                                  mg
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="border-b border-slate-700/50 py-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  Potassium
                                </span>
                                <span className="text-white">
                                  {Math.round(
                                    selectedFood.calories_calculated_for * 3
                                  )}
                                  mg
                                </span>
                              </div>
                            </div>

                            <div className="border-b border-slate-700/50 py-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  Vitamin A
                                </span>
                                <span className="text-white">
                                  {Math.round(
                                    selectedFood.calories_calculated_for * 0.6
                                  )}
                                  mcg
                                </span>
                              </div>
                            </div>

                            <div className="border-b border-slate-700/50 py-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  Vitamin C
                                </span>
                                <span className="text-white">
                                  {(
                                    selectedFood.calories_calculated_for * 0.05
                                  ).toFixed(1)}
                                  mg
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mt-4">
                          * The % Daily Value (DV) tells you how much a nutrient
                          in a serving of food contributes to a daily diet.
                          2,000 calories a day is used for general nutrition
                          advice.
                        </p>
                      </motion.div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <motion.div 
                          whileHover={{ y: -5 }}
                          className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-xl hover:border-slate-600"
                        >
                          <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                            <Info className="h-5 w-5 mr-2 text-indigo-500" />
                            Allergen Information
                          </h4>
                          <div className="space-y-2">
                            <div className="bg-gradient-to-br from-slate-900/50 to-black/30 p-3 rounded-lg border border-slate-700/50">
                              <h5 className="font-medium text-white mb-2">
                                May contain:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {selectedFood.food_name
                                  .toLowerCase()
                                  .includes("cheese") ||
                                  (selectedFood.food_name
                                    .toLowerCase()
                                    .includes("butter") && (
                                    <span className="px-2 py-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 text-amber-300 rounded-full text-xs border border-amber-800/40">
                                      Dairy
                                    </span>
                                  ))}
                                {selectedFood.food_name
                                  .toLowerCase()
                                  .includes("gluten") && (
                                  <span className="px-2 py-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 text-amber-300 rounded-full text-xs border border-amber-800/40">
                                    Gluten
                                  </span>
                                )}
                                {selectedFood.food_name
                                  .toLowerCase()
                                  .includes("chicken") && (
                                  <span className="px-2 py-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 text-amber-300 rounded-full text-xs border border-amber-800/40">
                                    Poultry
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div 
                          whileHover={{ y: -5 }}
                          className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-xl hover:border-slate-600"
                        >
                          <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                            <Heart className="h-5 w-5 mr-2 text-indigo-500" />
                            Health Benefits
                          </h4>

                          <div className="space-y-2 text-slate-300 text-sm">
                            <p className="flex items-start">
                              <span className="text-emerald-400 mr-2 flex-shrink-0">
                                ✓
                              </span>
                              {selectedFood.nutrients.protein >= 15
                                ? "High in protein to support muscle growth and tissue repair"
                                : "Contains protein which helps with muscle maintenance"}
                            </p>

                            <p className="flex items-start">
                              <span className="text-emerald-400 mr-2 flex-shrink-0">
                                ✓
                              </span>
                              {selectedFood.nutrients.carbs >= 20
                                ? "Rich in carbohydrates, providing energy for physical activities"
                                : "Moderate carbohydrate content for sustained energy"}
                            </p>

                            <p className="flex items-start">
                              <span className="text-emerald-400 mr-2 flex-shrink-0">
                                ✓
                              </span>
                              Provides essential calories needed for daily
                              metabolic functions
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Similar Foods
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {results
                        .filter(
                          (food) =>
                            food.food_unique_id !== selectedFood.food_unique_id
                        )
                        .slice(0, 3)
                        .map((food) => (
                          <motion.div
                            key={food.food_unique_id}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md border border-slate-700/50 rounded-lg overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all"
                            onClick={() => {
                              setSelectedFood(food);
                              setShowFullAnalysis(false);
                              generateInsights(food);
                            }}
                          >
                            <div className="h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 flex items-center justify-center">
                              <span className="text-2xl">
                                {getFoodEmoji(food.food_name)}
                              </span>
                            </div>

                            <div className="p-3">
                              <h4 className="text-white font-medium text-sm line-clamp-1">
                                {food.food_name}
                              </h4>
                              <div className="flex justify-between mt-1 text-xs">
                                <span className="text-slate-400">
                                  {Math.round(food.nutrients.calories)} kcal
                                </span>
                                <span className="text-slate-400">
                                  {food.serving_type}
                                </span>
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
          
          {/* Diary View Modal */}
          {showDiaryView && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-slate-900/80 to-black/70 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-700/50 overflow-hidden"
                style={{ maxHeight: "90vh" }}
              >
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Calendar className="h-6 w-6 mr-2 text-indigo-500" />
                    Food Diary
                  </h2>
                  <button
                    onClick={() => setShowDiaryView(false)}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 70px)" }}>
                  {/* Date selector */}
                  <div className="flex items-center justify-center mb-6">
                    <button 
                      onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
                      className="p-2 bg-slate-800 text-slate-300 rounded-full hover:bg-indigo-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <h3 className="text-xl font-medium text-white mx-6">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </h3>
                    
                    <button 
                      onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
                      className="p-2 bg-slate-800 text-slate-300 rounded-full hover:bg-indigo-700 transition-colors"
                      disabled={new Date(selectedDate).toDateString() === new Date().toDateString()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Meal type filter */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
                      <motion.button
                        key={mealType}
                        whileHover={{ y: -2, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveMealFilter(mealType)}
                        className={`px-4 py-2 rounded-full text-sm transition-all ${
                          activeMealFilter === mealType 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                      </motion.button>
                    ))}
                  </div>

                  {/* Daily totals */}
                  {getDiaryItemsByDate(selectedDate, activeMealFilter).length > 0 && (
                    <div className="bg-gradient-to-br from-slate-900/50 to-black/30 rounded-xl p-4 mb-6 border border-slate-700/50">
                      <h3 className="text-lg font-medium text-white mb-4">Daily Totals</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(calculateTotals(getDiaryItemsByDate(selectedDate, activeMealFilter))).map(([key, value]) => (
                          <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                            <div className="text-xs text-slate-400 mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                            <div className="text-lg font-bold text-white">
                              {Math.round(value)}{key === 'calories' ? '' : 'g'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Food items by meal type */}
                  {getDiaryItemsByDate(selectedDate, activeMealFilter).length > 0 ? (
                    <div>
                      {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                        const mealItems = activeMealFilter === 'all' 
                          ? getDiaryItemsByDate(selectedDate).filter(item => item.mealType === mealType)
                          : getDiaryItemsByDate(selectedDate, mealType);
                          
                        if (mealItems.length === 0 && activeMealFilter !== 'all') return null;
                        if (mealItems.length === 0) return null;
                        
                        return (
                          <div key={mealType} className="mb-6">
                            {activeMealFilter === 'all' && (
                              <h3 className="text-lg font-medium text-white mb-3 capitalize flex items-center">
                                {mealType === 'breakfast' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" /></svg>}
                                {mealType === 'lunch' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>}
                                {mealType === 'dinner' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" /></svg>}
                                {mealType === 'snack' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                                {mealType}
                              </h3>
                            )}
                            
                            <div className="space-y-3">
                              {mealItems.map((item) => (
                                <motion.div 
                                  key={new Date(item.date).getTime()}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-lg overflow-hidden flex flex-col md:flex-row"
                                >
                                  <div className="bg-gradient-to-r from-indigo-600/40 to-purple-600/40 p-4 flex items-center justify-center md:w-20">
                                    <span className="text-3xl">{getFoodEmoji(item.food.food_name)}</span>
                                  </div>
                                  
                                  <div className="p-4 flex-grow">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="text-lg font-medium text-white">{item.food.food_name}</h4>
                                        <p className="text-sm text-slate-300">
                                          {item.food.serving_type} • {formatTimeAgo(item.date)}
                                        </p>
                                      </div>
                                      
                                      <button 
                                        onClick={() => removeDiaryItem(new Date(item.date).getTime())}
                                        className="p-1 rounded-full text-slate-400 hover:bg-red-900/30 hover:text-red-300"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </div>
                                    
                                    <div className="flex mt-3 space-x-3">
                                      <div className="px-2 py-1 bg-indigo-900/40 rounded text-xs font-medium text-indigo-200 border border-indigo-500/30">
                                        {Math.round(item.food.nutrients.calories)} kcal
                                      </div>
                                      <div className="px-2 py-1 bg-blue-900/40 rounded text-xs font-medium text-blue-200 border border-blue-500/30">
                                        P: {item.food.nutrients.protein}g
                                      </div>
                                      <div className="px-2 py-1 bg-emerald-900/40 rounded text-xs font-medium text-emerald-200 border border-emerald-500/30">
                                        C: {item.food.nutrients.carbs}g
                                      </div>
                                      <div className="px-2 py-1 bg-amber-900/40 rounded text-xs font-medium text-amber-200 border border-amber-500/30">
                                        F: {item.food.nutrients.fats}g
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-slate-500" />
                      </div>
                      <h3 className="text-xl font-medium text-white mb-2">No food entries yet</h3>
                      <p className="text-slate-400 max-w-md mx-auto">
                        Search for foods and use the "Save to Diary" button to keep track of your meals.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="sticky bottom-0 bg-black/80 backdrop-blur-lg p-4 border-t border-slate-700/50">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDiaryView(false);
                      setQuery("");
                      setSelectedFood(null);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-xl text-white font-medium hover:opacity-90 shadow-lg transition-all"
                  >
                    Find and Add More Foods
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
          
          {/* Share Success Modal */}
          {shareModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Share2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mt-4 mb-2">Nutrition Info Copied!</h3>
                  <p className="text-slate-300 mb-4">
                    The food information has been copied to your clipboard. You can now paste it anywhere.
                  </p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-3 border border-slate-700/50 mb-4 max-h-40 overflow-y-auto">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                    {shareUrl}
                  </pre>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShareModalOpen(false)}
                    className="flex-1 py-2 border border-slate-700 rounded-lg text-white hover:bg-slate-800/50"
                  >
                    Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      // Show a toast or indicator that it was copied again
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white"
                  >
                    Copy Again
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
          
          {/* Seasonal Foods Modal */}
          {showSeasonalFoods && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-slate-900/80 to-black/70 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-700/50 overflow-hidden"
                style={{ maxHeight: "90vh" }}
              >
                <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-indigo-900/80 backdrop-blur-lg px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Award className="h-6 w-6 mr-2" />
                    {currentSeason} Seasonal Foods
                  </h2>
                  <button
                    onClick={() => setShowSeasonalFoods(false)}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 70px)" }}>
                  {/* Season selector */}
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {['Spring', 'Summer', 'Fall', 'Winter'].map((season) => (
                      <motion.button
                        key={season}
                        whileHover={{ y: -2, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => generateSeasonalFoods(season)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                          currentSeason === season 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {season}
                      </motion.button>
                    ))}
                  </div>
                  
                  {/* Season Info */}
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-medium bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text mb-2">
                      Eating with the seasons
                    </h3>
                    <p className="text-slate-300 max-w-2xl mx-auto">
                      Seasonal foods are fresher, more nutritious, and often more environmentally friendly. 
                      They're harvested at peak ripeness and typically require fewer resources to grow.
                    </p>
                  </div>

                  {/* Loading state */}
                  {loadingSeasonalFoods ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="relative w-20 h-20">
                        <div className="w-20 h-20 rounded-full border-4 border-slate-700/50 absolute top-0 left-0"></div>
                        <div className="w-20 h-20 rounded-full border-4 border-t-indigo-600 border-r-purple-600 border-transparent absolute top-0 left-0 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse"></div>
                        </div>
                      </div>
                      <p className="mt-5 text-xl font-medium bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                        Finding seasonal foods...
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Foods grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {seasonalFoods.length > 0 ? (
                          seasonalFoods.map((food, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden hover:border-indigo-500/40 transition-all"
                            >
                              <div className="h-16 bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-indigo-600/40 flex items-center justify-between px-4">
                                <span className="text-4xl">{food.emoji}</span>
                                <span className="px-2 py-1 bg-black/30 rounded-md text-xs uppercase tracking-wider text-slate-300 border border-slate-600/30">
                                  {food.category}
                                </span>
                              </div>
                              
                              <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-xl font-medium text-white">{food.name}</h3>
                                  <span className="px-2 py-1 bg-indigo-900/30 rounded text-xs text-indigo-300 capitalize border border-indigo-500/20">
                                    {food.mealType}
                                  </span>
                                </div>
                                
                                <p className="text-slate-300 text-sm mb-4">
                                  {food.description}
                                </p>
                                
                                <div className="mb-4">
                                  <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Key Nutrients</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {food.keyNutrients.map((nutrient, i) => (
                                      <span key={i} className="px-2 py-1 bg-slate-800/50 rounded-full text-xs text-slate-300 border border-slate-700/30">
                                        {nutrient}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="mb-4">
                                  <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Best Preparation</h4>
                                  <p className="text-sm text-slate-300">{food.prepMethod}</p>
                                </div>
                                
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setQuery(food.name);
                                    searchFoodAPI(food.name);
                                    setShowSeasonalFoods(false);
                                  }}
                                  className="w-full py-2 bg-gradient-to-r from-indigo-600/50 to-purple-600/50 hover:from-indigo-600 hover:to-purple-600 rounded-lg text-white flex items-center justify-center transition-all"
                                >
                                  <Search className="h-4 w-4 mr-1" />
                                  Get Nutrition Info
                                </motion.button>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-10">
                            <p className="text-slate-400">No seasonal foods found. Try selecting a different season.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="sticky bottom-0 bg-black/80 backdrop-blur-lg p-4 border-t border-slate-700/50">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-400 text-sm">
                      <span className="text-white">Tip:</span> Eating seasonally can reduce your environmental footprint
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSeasonalFoods(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm transition-all"
                    >
                      Close
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-black/70 via-slate-900/70 to-black/70 backdrop-blur-lg border-t border-slate-800/80 py-10 mt-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400 text-transparent bg-clip-text font-devanagari">
                  अन्ना - Data
                </span>
                <p className="text-slate-400 mt-1">
                  Discover the nutrition behind your food
                </p>
              </div>

              <div className="flex gap-8">
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  About
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-500">
              &copy; {new Date().getFullYear()} अन्ना - Data. Created by Niladri
              Hazra. All rights reserved.
            </div>
          </div>
        </footer>
        
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
    </AuthCheck>
  );
}