"use client";
import React, { Suspense } from "react";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ChefHat,
  Clock,
  Users,
  Utensils,
  Search,
  Upload,
  Camera,
  ArrowLeft,
  MessageCircle,
  X,
  Home as HomeIcon,
  Calendar,
  User,
  Bell,
  Settings,
  PlaySquare,
  Volume2,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Fullscreen,
  FullscreenExit,
  Bookmark,
  Star,
  ThumbsUp,
  History,
  Filter,
  Link,
  Share2,
  Check,
  Plus,
} from "lucide-react";
import Image from "next/image";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ""
);


// Loading component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="relative w-16 h-16">
      <div className="w-16 h-16 rounded-full border-4 border-slate-700/50 absolute top-0 left-0"></div>
      <div className="w-16 h-16 rounded-full border-4 border-t-indigo-600 border-r-purple-600 border-transparent absolute top-0 left-0 animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse"></div>
      </div>
    </div>
    <p className="mt-5 text-xl font-medium bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
      Searching for recipes...
    </p>
  </div>
);

// Recipe card component for search history
const RecipeHistoryCard = ({ recipe, onClick }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl hover:border-indigo-500/30 transition-all group"
  >
    <div className="h-24 bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-indigo-600/40 relative overflow-hidden">
      {/* Animated particles background */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: `${Math.random() * 6 + 3}px`,
              height: `${Math.random() * 6 + 3}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 5}s linear infinite`,
            }}
          ></div>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <ChefHat className="h-10 w-10 text-white/70 group-hover:text-white/90 transition-all" />
      </div>
    </div>
    <div className="p-4">
      <h3 className="text-white font-medium text-base line-clamp-1">
        {recipe.name}
      </h3>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center text-xs text-slate-400">
          <Clock className="h-3 w-3 mr-1" />
          <span>{recipe.totalTime || "30"} min</span>
        </div>
        <div className="flex items-center text-xs text-slate-400">
          <Utensils className="h-3 w-3 mr-1" />
          <span>{recipe.difficulty || "Medium"}</span>
        </div>
      </div>
    </div>
  </motion.div>
);
function SearchParamsWrapper({ children }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}

export default function RecipePage() {
  const router = useRouter();
  
  // Wrap the component that uses useSearchParams in a Suspense boundary
  return (
    <SearchParamsWrapper>
      <RecipeContent />
    </SearchParamsWrapper>
  );
}
 function RecipeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("query") || "";

  const [query, setQuery] = useState(initialQuery);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFullscreen, setChatFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [relatedRecipes, setRelatedRecipes] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [foodImage, setFoodImage] = useState(null);
  const [foodImageLoading, setFoodImageLoading] = useState(false);
  const [showMealTypeDialog, setShowMealTypeDialog] = useState(false);
  const [savingToDiary, setSavingToDiary] = useState(false);
  const [diarySaveSuccess, setDiarySaveSuccess] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [recipeSections, setRecipeSections] = useState([
    { id: "overview", label: "Overview" },
    { id: "ingredients", label: "Ingredients" },
    { id: "instructions", label: "Instructions" },
    { id: "nutrition", label: "Nutrition" },
    { id: "tips", label: "Tips" },
  ]);

  const videoRef = useRef(null);
  const videoPlayerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatInputRef = useRef(null);

  // Load recipe on initial render if query exists
  useEffect(() => {
    // Load search history from localStorage
    try {
      const history = localStorage.getItem("recipeSearchHistory");
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (e) {
      console.error("Error loading search history:", e);
    }

    // Load bookmarks from localStorage
    try {
      const savedBookmarks = localStorage.getItem("recipeBookmarks");
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (e) {
      console.error("Error loading bookmarks:", e);
    }

    if (initialQuery) {
      searchRecipe(initialQuery);
    }
  }, [initialQuery]);

  // Add YouTube API initialization
useEffect(() => {
    // Function to initialize YouTube API
    const loadYouTubeAPI = () => {
      if (!window.onYouTubeIframeAPIReady) {
        // Only set once to avoid multiple definitions
        window.onYouTubeIframeAPIReady = () => {
          console.log("YouTube IFrame API ready");
        };
        
        // Only load if not already loaded
        if (!window.YT) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
      }
    };
  
    // Load the API if we have a recipe
    if (recipe) {
      loadYouTubeAPI();
    }
  }, [recipe]);
  
  // Add event listener for YouTube postMessage handling
  useEffect(() => {
    const handleYouTubeMessage = (event) => {
      // Check if message is from YouTube iframe
      if (event.data && typeof event.data === "string" && event.data.includes("onStateChange")) {
        try {
          const data = JSON.parse(event.data);
          // Update playing state based on YouTube state
          if (data.event === "onStateChange") {
            if (data.info === 1) { // Playing
              setIsPlaying(true);
            } else if (data.info === 2) { // Paused
              setIsPlaying(false);
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    };
    
    window.addEventListener("message", handleYouTubeMessage);
    
    return () => {
      window.removeEventListener("message", handleYouTubeMessage);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Handle fullscreen chat container
  useEffect(() => {
    if (chatFullscreen && chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: "smooth" });
      // Focus the input field
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }
  }, [chatFullscreen]);

  // Generate food image when recipe is loaded
  useEffect(() => {
    if (recipe && !foodImage) {
      generateFoodImage(recipe.name, recipe.imageDescription);
    }

    // Check if this recipe is bookmarked
    if (recipe) {
      const isBookmarked = bookmarks.some(
        (bookmark) => bookmark.name === recipe.name
      );
      setBookmarked(isBookmarked);

      // Search for YouTube video
      searchYouTubeVideo(recipe.name);
    }
  }, [recipe]);

  // Search for YouTube video using RapidAPI
  const searchYouTubeVideo = async (recipeName) => {
    setVideoLoading(true);
    setVideoError(null);
    
    try {
      // Use a more reliable method - direct search with fallback
      const searchTerm = `${recipeName} recipe cooking how to make`;
      
      // First try directly constructing a video ID using search term
      const videoId = await getYouTubeVideoId(searchTerm);
      
      if (videoId) {
        setVideoInfo({
          videoId: videoId,
          title: `How to Make ${recipeName}`,
          channelName: "Cooking Channel",
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          viewCount: "10K+",
          publishedTimeText: "Popular recipe video"
        });
      } else {
        // Fallback to Gemini
        await searchYouTubeWithGemini(recipeName);
      }
      
      // Also generate related recipes
      generateRelatedRecipes(recipeName);
    } catch (error) {
      console.error('Error finding YouTube video:', error);
      
      // Final fallback - use a reliable video ID for cooking
      setVideoInfo({
        videoId: "8TJx53wkH8A", // A reliable cooking channel video ID
        title: `${recipeName} Recipe Guide`,
        channelName: "Cooking Basics",
        thumbnailUrl: "https://i.ytimg.com/vi/8TJx53wkH8A/hqdefault.jpg"
      });
    } finally {
      setVideoLoading(false);
    }
  };

  const getYouTubeVideoId = async (searchTerm) => {
    // This is a simplified approach to get a predictable video ID based on search term
    // In real implementation, you'd use an API or server-side search
    
    // Create a consistent hash from search term to map to known cooking videos
    const hashCode = str => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    // List of reliable cooking video IDs that work well for embedding
    const reliableVideoIds = [
      "8TJx53wkH8A", // General cooking
      "JsB57FtaxXQ", // Baking
      "5EJoLi5sMd8", // Italian
      "Kt5sDNMaWnc", // Asian cuisine
      "qWAagS_MANg", // Indian food
      "DF8Qnq4BIqs", // Desserts
      "Y_ZS_EfoYpA", // Breakfast
      "qBGHZOyz_Ik", // Healthy cooking
      "ydbMAFaA6Uw", // Quick meals
      "lCLZZHJmPcU"  // Advanced cooking
    ];
    
    // Select a video based on the hash of the search term
    const index = hashCode(searchTerm) % reliableVideoIds.length;
    return reliableVideoIds[index];
  };

  // Fallback: Search YouTube videos using Gemini
  const searchYouTubeWithGemini = async (recipeName) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Find a good YouTube video for cooking "${recipeName}".
        
        Format your response as a JSON object with these fields only:
        {
          "videoId": "the YouTube video ID",
          "title": "the title of the video",
          "channelName": "name of the YouTube channel"
        }
        
        Choose a video with good ratings and clear instructions.
        Return ONLY valid JSON, no markdown formatting or explanations.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean the text to ensure valid JSON
      const cleanedText = text.replace(/```json|```/g, "").trim();

      const videoData = JSON.parse(cleanedText);
      setVideoInfo({
        ...videoData,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoData.videoId}/hqdefault.jpg`,
      });

      // Generate related recipes
      generateRelatedRecipes(recipeName);
    } catch (error) {
      console.error("Error in Gemini YouTube fallback:", error);
      setVideoError("Couldn't find a video for this recipe");
    }
  };

  // Function to generate food image using Gemini
  // Replace the generateFoodImage function with this version:
  const generateFoodImage = async (foodName, description) => {
    setFoodImageLoading(true);

    try {
      // Instead of using external image APIs, we'll set a flag that we're using a styled background
      setFoodImage("gradient-placeholder");

      // Still store the description for possible future use
      localStorage.setItem(
        `food-description-${encodeURIComponent(foodName)}`,
        description
      );
    } catch (error) {
      console.error("Error generating food image:", error);
      setFoodImage("gradient-placeholder");
    } finally {
      setFoodImageLoading(false);
    }
  };

  // Function to generate related recipes
  const generateRelatedRecipes = async (recipeName) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Generate 4 related recipes to "${recipeName}" that people might also like.
        
        Format your response as a JSON array with these fields for each recipe:
        {
          "name": "Recipe name",
          "description": "Brief description (25 words max)",
          "totalTime": "Cooking time in minutes",
          "difficulty": "Easy/Medium/Hard",
          "imageKeyword": "A single keyword to represent this dish for an image"
        }
        
        Return ONLY valid JSON, no markdown formatting or explanations.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean the text to ensure valid JSON
      const cleanedText = text.replace(/```json|```/g, "").trim();

      const relatedRecipesData = JSON.parse(cleanedText);

      // Add image URLs to each recipe
      const processedRecipes = relatedRecipesData.map((recipe) => {
        const imageKeyword = recipe.imageKeyword || recipe.name;
        return {
          ...recipe,
          imageUrl: `https://source.unsplash.com/400x300/?${encodeURIComponent(
            imageKeyword
          )},food`,
        };
      });

      setRelatedRecipes(processedRecipes);
    } catch (error) {
      console.error("Error generating related recipes:", error);

      // Set fallback related recipes with generic images
      const fallbackRecipes = [
        {
          name: "Quick Pasta Primavera",
          description:
            "Fresh vegetables and pasta in a light sauce, perfect for a weeknight dinner.",
          totalTime: "25",
          difficulty: "Easy",
          imageUrl: "https://source.unsplash.com/400x300/?pasta,vegetables",
        },
        {
          name: "Garlic Herb Roast Chicken",
          description: "Juicy roast chicken with a flavorful herb crust.",
          totalTime: "75",
          difficulty: "Medium",
          imageUrl: "https://source.unsplash.com/400x300/?roast,chicken",
        },
        {
          name: "Vegetable Stir Fry",
          description:
            "Quick and healthy vegetable stir fry with your choice of protein.",
          totalTime: "20",
          difficulty: "Easy",
          imageUrl: "https://source.unsplash.com/400x300/?stirfry,vegetables",
        },
        {
          name: "Berry Smoothie Bowl",
          description:
            "Nutritious breakfast bowl with fresh berries and toppings.",
          totalTime: "10",
          difficulty: "Easy",
          imageUrl: "https://source.unsplash.com/400x300/?smoothie,bowl",
        },
      ];

      setRelatedRecipes(fallbackRecipes);
    }
  };

  // Handle video player controls
  // Updated video player control functions
const togglePlay = () => {
    try {
      if (videoRef.current && videoRef.current.contentWindow) {
        const message = isPlaying 
          ? '{"event":"command","func":"pauseVideo","args":""}' 
          : '{"event":"command","func":"playVideo","args":""}';
        
        videoRef.current.contentWindow.postMessage(message, '*');
        setIsPlaying(!isPlaying);
      }
    } catch (error) {
      console.error("Error controlling video playback:", error);
    }
  };
  
  const toggleMute = () => {
    try {
      if (videoRef.current && videoRef.current.contentWindow) {
        const message = isMuted
          ? '{"event":"command","func":"unMute","args":""}'
          : '{"event":"command","func":"mute","args":""}';
        
        videoRef.current.contentWindow.postMessage(message, '*');
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error("Error controlling video audio:", error);
    }
  };
  
  const toggleFullscreen = () => {
    try {
      if (videoPlayerRef.current) {
        if (!document.fullscreenElement) {
          // Request fullscreen
          if (videoPlayerRef.current.requestFullscreen) {
            videoPlayerRef.current.requestFullscreen();
          } else if (videoPlayerRef.current.webkitRequestFullscreen) { 
            videoPlayerRef.current.webkitRequestFullscreen();
          } else if (videoPlayerRef.current.msRequestFullscreen) {
            videoPlayerRef.current.msRequestFullscreen();
          }
          setIsFullscreen(true);
        } else {
          // Exit fullscreen
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };
  // Function to search recipe using Gemini
  const searchRecipe = async (searchQuery) => {
    setLoading(true);
    setError(null);
    setRecipe(null);
    setFoodImage(null); // Reset food image
    setVideoInfo(null); // Reset video info

    // Add to search history
    if (searchQuery) {
      const updatedHistory = [...searchHistory];

      // Remove if already exists (to move to top)
      const existingIndex = updatedHistory.findIndex(
        (item) =>
          item.query && item.query.toLowerCase() === searchQuery.toLowerCase()
      );

      if (existingIndex > -1) {
        updatedHistory.splice(existingIndex, 1);
      }

      // Add to beginning of array and limit to 8 items
      updatedHistory.unshift({
        query: searchQuery,
        timestamp: new Date().toISOString(),
      });

      const limitedHistory = updatedHistory.slice(0, 8);
      setSearchHistory(limitedHistory);

      try {
        localStorage.setItem(
          "recipeSearchHistory",
          JSON.stringify(limitedHistory)
        );
      } catch (e) {
        console.error("Error saving search history:", e);
      }
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Give me a detailed recipe for "${searchQuery}".
        
        Format your response as a JSON object with these fields:
        {
          "name": "Recipe name",
          "description": "Brief description of the dish",
          "prepTime": "Preparation time in minutes",
          "cookTime": "Cooking time in minutes",
          "totalTime": "Total time in minutes",
          "servings": Number of servings,
          "difficulty": "Easy/Medium/Hard",
          "cuisine": "Cuisine type",
          "ingredients": ["List of ingredients with quantities"],
          "instructions": ["Step by step instructions"],
          "nutritionFacts": {
            "calories": Number,
            "protein": Number in grams,
            "carbs": Number in grams,
            "fat": Number in grams
          },
          "tips": ["Cooking and serving tips"],
          "imageDescription": "A detailed description of what the dish looks like for AI image generation"
        }
        
        Only respond with valid JSON, no markdown formatting or explanations.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean the text to ensure valid JSON
      const cleanedText = text.replace(/```json|```/g, "").trim();

      const recipeData = JSON.parse(cleanedText);

      // Generate an image description for the recipe if not provided
      if (
        !recipeData.imageDescription ||
        recipeData.imageDescription.trim() === ""
      ) {
        try {
          const imageModel = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
          });
          const imagePrompt = `
            Create a professional food photography description of ${recipeData.name}. 
            This will be used to generate an AI image. Be specific about the plating, 
            ingredients visible, background, lighting, and style. Make it detailed and 
            appetizing. Keep it under 100 words.
          `;

          const imageResult = await imageModel.generateContent(imagePrompt);
          const imageResponse = await imageResult.response;
          const imageDescription = imageResponse.text();

          recipeData.imageDescription = imageDescription;
        } catch (imageError) {
          console.error("Error generating image description:", imageError);
          recipeData.imageDescription = `Professional food photo of ${recipeData.name} garnished and plated beautifully`;
        }
      }

      setRecipe(recipeData);

      // Reset chat messages when changing recipes
      setChatMessages([]);
    } catch (error) {
      console.error("Error searching for recipe:", error);
      setError("Failed to search for recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle bookmarking a recipe
  const toggleBookmark = () => {
    if (!recipe) return;

    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);

    let updatedBookmarks = [...bookmarks];

    if (newBookmarked) {
      // Add to bookmarks if not already there
      if (!updatedBookmarks.some((bookmark) => bookmark.name === recipe.name)) {
        const bookmarkEntry = {
          name: recipe.name,
          description: recipe.description,
          cuisine: recipe.cuisine,
          difficulty: recipe.difficulty,
          totalTime: recipe.totalTime,
          timestamp: new Date().toISOString(),
        };

        updatedBookmarks.unshift(bookmarkEntry);
      }
    } else {
      // Remove from bookmarks
      updatedBookmarks = updatedBookmarks.filter(
        (bookmark) => bookmark.name !== recipe.name
      );
    }

    setBookmarks(updatedBookmarks);

    try {
      localStorage.setItem("recipeBookmarks", JSON.stringify(updatedBookmarks));
    } catch (e) {
      console.error("Error saving bookmarks:", e);
    }
  };

  // Save to food diary
  const saveToFoodDiary = async (mealType) => {
    if (!recipe) return;

    setSavingToDiary(true);

    try {
      // Get current food diary from localStorage
      const savedFoods = JSON.parse(localStorage.getItem("savedFoods") || "[]");

      // Create nutrition data based on recipe
      const nutritionData = {
        calories: recipe.nutritionFacts.calories,
        protein: recipe.nutritionFacts.protein,
        carbs: recipe.nutritionFacts.carbs,
        fats: recipe.nutritionFacts.fat,
      };

      // Create new entry for food diary
      const newEntry = {
        food: {
          food_name: recipe.name,
          food_id: Date.now(),
          food_unique_id: `recipe-${Date.now()}`,
          common_names: recipe.name,
          serving_type: `${recipe.servings} servings`,
          calories_calculated_for: 100,
          nutrients: nutritionData,
        },
        mealType,
        date: new Date().toISOString(),
      };

      // Add to saved foods
      savedFoods.push(newEntry);

      // Save to localStorage
      localStorage.setItem("savedFoods", JSON.stringify(savedFoods));

      // Show success message
      setDiarySaveSuccess(true);
      setTimeout(() => setDiarySaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving to food diary:", error);
      alert("Failed to save to food diary");
    } finally {
      setSavingToDiary(false);
      setShowMealTypeDialog(false);
    }
  };

  // Share recipe
  const shareRecipe = async () => {
    if (!recipe) return;

    const shareData = {
      title: `Recipe: ${recipe.name}`,
      text: `Check out this amazing recipe for ${recipe.name} that I found!\n\n${recipe.description}\n\nCuisine: ${recipe.cuisine}\nDifficulty: ${recipe.difficulty}\nTime: ${recipe.totalTime} minutes`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support sharing
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);

        setShareModalOpen(true);
      }
    } catch (error) {
      console.error("Error sharing recipe:", error);
    }
  };

  // Handle file input change for image upload
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));

      // Identify the food in the image
      identifyFoodInImage(file);
    }
  };

  // Identify food in uploaded image
  const identifyFoodInImage = async (file) => {
    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const base64Image = reader.result.split(",")[1];

          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          const parts = [
            {
              text: "What food dish is in this image? Return only the dish name without any explanations.",
            },
            {
              inlineData: {
                mimeType: file.type || "image/jpeg",
                data: base64Image,
              },
            },
          ];

          const result = await model.generateContent({
            contents: [{ role: "user", parts }],
          });
          const response = await result.response;
          const identifiedFood = response.text().trim();

          setQuery(identifiedFood);
          searchRecipe(identifiedFood);
        } catch (error) {
          console.error("Error identifying food:", error);
          setError(
            "Failed to identify food in the image. Please try a text search instead."
          );
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read image file. Please try again.");
        setLoading(false);
      };
    } catch (error) {
      console.error("Error processing image:", error);
      setError("Failed to process image. Please try again.");
      setLoading(false);
    }
  };

  // Send message to Anna AI Cook
  const sendMessage = async () => {
    if (!userMessage.trim()) return;

    // Add user message to chat
    const newMessage = { role: "user", content: userMessage };
    setChatMessages([...chatMessages, newMessage]);
    setUserMessage("");
    setChatLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Create context for the AI
      let context = `You are Anna AI Cook, a cooking assistant. `;

      if (recipe) {
        context += `The user is viewing a recipe for ${recipe.name}. 
        The recipe has these ingredients: ${recipe.ingredients.join(", ")}. 
        The cooking steps are: ${recipe.instructions.join(" ")}`;
      }

      const prompt = `${context}
      
      User question: ${userMessage}
      
      Provide a helpful, friendly response with cooking advice. Keep your answer concise but informative.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Add AI response to chat
      setChatMessages([
        ...chatMessages,
        newMessage,
        { role: "assistant", content: text },
      ]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setChatMessages([
        ...chatMessages,
        newMessage,
        {
          role: "assistant",
          content:
            "I'm sorry, I'm having trouble connecting right now. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#070B14] via-[#0b1120] to-[#0A0E1A] text-white">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

      {/* Animated glowing orb */}
      <div className="fixed top-1/4 -right-28 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="fixed top-3/4 -left-28 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-black/80 via-black/70 to-black/80 border-b border-slate-800/60 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-full hover:bg-slate-800/60 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="font-bold text-xl md:text-2xl">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                  Recipe Finder
                </span>
              </h1>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => router.push("/diary")}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Food Diary
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors relative"
              >
                <History className="mr-2 h-4 w-4" />
                History
              </button>
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-indigo-700/50 hover:bg-indigo-700 transition-colors"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Ask Anna AI Cook
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md hover:bg-slate-800/60 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <div className="flex flex-col space-y-1">
                    <div className="w-5 h-0.5 bg-white"></div>
                    <div className="w-5 h-0.5 bg-white"></div>
                    <div className="w-5 h-0.5 bg-white"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/90 backdrop-blur-lg border-b border-slate-800/60 md:hidden"
          >
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => router.push("/")}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => router.push("/diary")}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Food Diary
              </button>
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <History className="mr-2 h-4 w-4" />
                Search History
              </button>
              <button
                onClick={() => {
                  setChatOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium bg-indigo-700/50 hover:bg-indigo-700 transition-colors"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Ask Anna AI Cook
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Search history dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed right-4 md:right-10 top-16 md:top-16 z-40 w-64 md:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-white">Recent Searches</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {searchHistory.map((item, index) => {
              // For previous searches, we need to load the recipe from saved data
              const savedRecipe = {
                name: item.query,
                totalTime: "30", // Default value, updated later
                difficulty: "Medium", // Default value
              };

              return (
                <RecipeHistoryCard
                  key={index}
                  recipe={savedRecipe}
                  onClick={() => {
                    searchRecipe(item.query);
                    setShowHistory(false);
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all">
            <div className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchRecipe(query)}
                    placeholder="Search for any recipe..."
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-full py-3 pl-5 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                  <button
                    onClick={() => searchRecipe(query)}
                    className="absolute right-1 top-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-2 hover:opacity-90 transition-all"
                    disabled={loading}
                  >
                    <Search className="h-5 w-5 text-white" />
                  </button>
                </div>

                <button
                  onClick={() =>
                    document.getElementById("recipe-image").click()
                  }
                  className="p-3 bg-slate-900/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-full transition-colors"
                >
                  <Upload className="h-5 w-5" />
                </button>

                <input
                  type="file"
                  id="recipe-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {imagePreview && (
                <div className="mt-4 relative">
                  <img
                    src={imagePreview}
                    alt="Food preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-900/20 border border-red-800/40 backdrop-blur-md text-white rounded-lg p-4 mb-6">
              <p className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-400 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Recipe Display */}
        {recipe && !loading && (
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Recipe Header with Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Recipe Info */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all h-full">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {recipe.name}
                      </h1>
                      <button
                        onClick={toggleBookmark}
                        className={`p-2 rounded-full ${
                          bookmarked
                            ? "bg-indigo-700/80 text-white"
                            : "bg-slate-800/80 text-slate-300"
                        } transition-all`}
                      >
                        <Bookmark
                          className={`h-5 w-5 ${
                            bookmarked ? "fill-white" : ""
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-white/80 mb-6">{recipe.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
                        <Clock className="h-5 w-5 text-indigo-400" />
                        <div>
                          <div className="text-sm text-slate-400">
                            Total Time
                          </div>
                          <div className="font-medium">
                            {recipe.totalTime} min
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
                        <Users className="h-5 w-5 text-indigo-400" />
                        <div>
                          <div className="text-sm text-slate-400">Servings</div>
                          <div className="font-medium">{recipe.servings}</div>
                        </div>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
                        <Utensils className="h-5 w-5 text-indigo-400" />
                        <div>
                          <div className="text-sm text-slate-400">
                            Difficulty
                          </div>
                          <div className="font-medium">{recipe.difficulty}</div>
                        </div>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
                        <ChefHat className="h-5 w-5 text-indigo-400" />
                        <div>
                          <div className="text-sm text-slate-400">Cuisine</div>
                          <div className="font-medium">{recipe.cuisine}</div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowMealTypeDialog(true)}
                        disabled={savingToDiary}
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white flex items-center justify-center hover:opacity-90 disabled:opacity-70 transition-all"
                      >
                        {diarySaveSuccess ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        {diarySaveSuccess
                          ? "Saved to Diary"
                          : "Save to Food Diary"}
                      </button>

                      <button
                        onClick={shareRecipe}
                        className="flex-1 py-2 px-4 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg text-white flex items-center justify-center transition-all border border-slate-700/50"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recipe Image Section - Replace with this */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all">
                  <div className="relative h-full min-h-[250px]">
                    {foodImageLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center overflow-hidden">
                        {/* Animated background elements */}
                        {[...Array(15)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute rounded-full bg-white/10"
                            style={{
                              width: `${Math.random() * 12 + 5}px`,
                              height: `${Math.random() * 12 + 5}px`,
                              top: `${Math.random() * 100}%`,
                              left: `${Math.random() * 100}%`,
                              animation: `float ${
                                Math.random() * 15 + 10
                              }s linear infinite`,
                            }}
                          ></div>
                        ))}

                        {/* Icon based on cuisine type */}
                        <ChefHat className="h-24 w-24 text-white/30" />

                        {/* Recipe name overlay */}
                        <div className="absolute bottom-4 left-4 right-4 text-center bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                          <h3 className="text-xl font-medium text-white">
                            {recipe.name}
                          </h3>
                        </div>
                      </div>
                    )}

                    {/* Overlay gradient for better text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                    {/* Cuisine tag */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium border border-slate-600/50">
                        {recipe.cuisine} Cuisine
                      </div>
                    </div>

                    {/* Nutrition quick info */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 border border-slate-600/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">
                            Nutrition per serving
                          </span>
                          <span className="text-sm font-bold text-indigo-400">
                            {Math.round(recipe.nutritionFacts.calories)} kcal
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>P: {recipe.nutritionFacts.protein}g</span>
                          <span>C: {recipe.nutritionFacts.carbs}g</span>
                          <span>F: {recipe.nutritionFacts.fat}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

             {/* YouTube Video Section */}
{/* {videoLoading ? (
  <div className="mb-8 bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl overflow-hidden border border-slate-700/50 shadow-xl p-8 flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 border-4 border-t-indigo-600 border-indigo-600/30 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-300">Loading video...</p>
    </div>
  </div>
) : videoInfo ? (
  <div className="mb-8 bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl overflow-hidden border border-slate-700/50 shadow-xl">
    <div className="p-4 border-b border-slate-700/50">
      <h2 className="text-xl font-bold text-white flex items-center">
        <PlaySquare className="mr-2 h-5 w-5 text-indigo-400" />
        Watch How to Make {recipe.name}
      </h2>
    </div>
    
    <div ref={videoPlayerRef} className="relative">
      
      <iframe
        ref={videoRef}
        src={`https://www.youtube.com/embed/${videoInfo.videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&widgetid=1&rel=0`}
        title={videoInfo.title || `How to make ${recipe.name}`}
        className="w-full aspect-video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      ></iframe>
       */}
      {/* Video overlay controls with improved styling */}
      {/* <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={togglePlay} 
              className="text-white hover:text-indigo-400 transition-colors bg-black/30 backdrop-blur-sm rounded-full p-2"
            >
              {isPlaying ? <PauseCircle className="h-8 w-8" /> : <PlayCircle className="h-8 w-8" />}
            </button>
            
            <button 
              onClick={toggleMute} 
              className="text-white hover:text-indigo-400 transition-colors bg-black/30 backdrop-blur-sm rounded-full p-2"
            >
              <Volume2 className={`h-6 w-6 ${isMuted ? 'opacity-50' : ''}`} />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <a 
              href={`https://www.youtube.com/watch?v=${videoInfo.videoId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-indigo-400 transition-colors bg-black/30 backdrop-blur-sm rounded-full p-2"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            
            <button 
              onClick={toggleFullscreen} 
              className="text-white hover:text-indigo-400 transition-colors bg-black/30 backdrop-blur-sm rounded-full p-2"
            >
              {isFullscreen ? <FullscreenExit className="h-5 w-5" /> : <Fullscreen className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white line-clamp-1">
            {videoInfo.title || `How to Make ${recipe.name} - Recipe Tutorial`}
          </h3>
          <p className="text-sm text-slate-400">{videoInfo.channelName || "Cooking Channel"}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm text-slate-300">Recommended</span>
        </div>
      </div>
    </div>
  </div>
) : videoError ? (
  <div className="mb-8 bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl overflow-hidden border border-slate-700/50 shadow-xl p-6 flex items-center justify-center">
    <p className="text-slate-300">No video available for this recipe.</p>
  </div>
) : null} */}
              {/* Section navigation */}
              <div className="mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex space-x-2 min-w-max">
                  {recipeSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                          : "bg-slate-900/40 text-slate-300 hover:bg-slate-800/60 border border-slate-700/50"
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipe Content based on active section */}
              {activeSection === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Ingredients Summary */}
                  <div className="md:col-span-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 shadow-lg"
                    >
                      <h2 className="text-xl font-bold flex items-center mb-4">
                        <Utensils className="mr-2 h-5 w-5 text-indigo-400" />
                        Key Ingredients
                      </h2>

                      <ul className="space-y-2">
                        {recipe.ingredients
                          .slice(0, 6)
                          .map((ingredient, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.05,
                              }}
                              className="flex items-baseline gap-3 text-white/80"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                              <span>{ingredient}</span>
                            </motion.li>
                          ))}
                      </ul>

                      {recipe.ingredients.length > 6 && (
                        <button
                          onClick={() => setActiveSection("ingredients")}
                          className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm flex items-center"
                        >
                          View all {recipe.ingredients.length} ingredients
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </motion.div>
                  </div>

                  {/* Quick Instructions */}
                  <div className="md:col-span-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 shadow-lg"
                    >
                      <h2 className="text-xl font-bold flex items-center mb-4">
                        <ChefHat className="mr-2 h-5 w-5 text-indigo-400" />
                        Quick Guide
                      </h2>

                      <div className="space-y-4">
                        {recipe.instructions.slice(0, 3).map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30"
                          >
                            <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className="text-white/90">{step}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {recipe.instructions.length > 3 && (
                        <button
                          onClick={() => setActiveSection("instructions")}
                          className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm flex items-center"
                        >
                          View all {recipe.instructions.length} steps
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </motion.div>
                  </div>

                  {/* Nutrition Summary */}
                  <div className="md:col-span-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 shadow-lg h-full"
                    >
                      <h2 className="text-xl font-bold flex items-center mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-indigo-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a3 3 0 00-3 3v2H7a1 1 0 000 2h1v1a1 1 0 01-1 1 1 1 0 100 2h6a1 1 0 100-2H9.83c.11-.313.17-.65.17-1v-1h1a1 1 0 100-2h-1V7a1 1 0 112 0 1 1 0 102 0 3 3 0 00-3-3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Nutrition Facts
                      </h2>

                      {/* Macronutrient distribution chart */}
                      <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">
                          Macronutrient Distribution
                        </h3>
                        <div className="h-6 bg-slate-800/50 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              width: `${Math.round(
                                ((recipe.nutritionFacts.protein * 4) /
                                  recipe.nutritionFacts.calories) *
                                  100
                              )}%`,
                            }}
                          >
                            {Math.round(
                              ((recipe.nutritionFacts.protein * 4) /
                                recipe.nutritionFacts.calories) *
                                100
                            )}
                            %
                          </div>
                          <div
                            className="h-full bg-teal-600 flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              width: `${Math.round(
                                ((recipe.nutritionFacts.carbs * 4) /
                                  recipe.nutritionFacts.calories) *
                                  100
                              )}%`,
                            }}
                          >
                            {Math.round(
                              ((recipe.nutritionFacts.carbs * 4) /
                                recipe.nutritionFacts.calories) *
                                100
                            )}
                            %
                          </div>
                          <div
                            className="h-full bg-amber-600 flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              width: `${Math.round(
                                ((recipe.nutritionFacts.fat * 9) /
                                  recipe.nutritionFacts.calories) *
                                  100
                              )}%`,
                            }}
                          >
                            {Math.round(
                              ((recipe.nutritionFacts.fat * 9) /
                                recipe.nutritionFacts.calories) *
                                100
                            )}
                            %
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>
                            <span>Protein</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-teal-600 mr-1"></div>
                            <span>Carbs</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-amber-600 mr-1"></div>
                            <span>Fat</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700/30">
                          <div className="text-sm text-slate-400 mb-1">
                            Calories
                          </div>
                          <div className="text-xl font-bold text-white">
                            {recipe.nutritionFacts.calories}{" "}
                            <span className="text-sm font-normal">kcal</span>
                          </div>
                        </div>
                        <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700/30">
                          <div className="text-sm text-slate-400 mb-1">
                            Protein
                          </div>
                          <div className="text-xl font-bold text-white">
                            {recipe.nutritionFacts.protein}{" "}
                            <span className="text-sm font-normal">g</span>
                          </div>
                        </div>
                        <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700/30">
                          <div className="text-sm text-slate-400 mb-1">
                            Carbs
                          </div>
                          <div className="text-xl font-bold text-white">
                            {recipe.nutritionFacts.carbs}{" "}
                            <span className="text-sm font-normal">g</span>
                          </div>
                        </div>
                        <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700/30">
                          <div className="text-sm text-slate-400 mb-1">Fat</div>
                          <div className="text-xl font-bold text-white">
                            {recipe.nutritionFacts.fat}{" "}
                            <span className="text-sm font-normal">g</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveSection("nutrition")}
                        className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm flex items-center"
                      >
                        View detailed nutrition
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </motion.div>
                  </div>

                  {/* Tips Summary */}
                  <div className="md:col-span-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-md rounded-xl border border-indigo-500/20 p-5 shadow-lg h-full"
                    >
                      <h2 className="text-xl font-bold flex items-center mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-indigo-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        Chef's Tips
                      </h2>

                      <ul className="space-y-3">
                        {recipe.tips.slice(0, 3).map((tip, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex items-start gap-3 text-white/90"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{tip}</span>
                          </motion.li>
                        ))}
                      </ul>

                      {recipe.tips.length > 3 && (
                        <button
                          onClick={() => setActiveSection("tips")}
                          className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm flex items-center"
                        >
                          View all {recipe.tips.length} tips
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Complete Ingredients List */}
              {activeSection === "ingredients" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 shadow-lg"
                >
                  <h2 className="text-xl font-bold flex items-center mb-6">
                    <Utensils className="mr-2 h-5 w-5 text-indigo-400" />
                    Ingredients ({recipe.ingredients.length})
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recipe.ingredients.map((ingredient, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="flex items-baseline gap-3 text-white/80 bg-slate-900/30 p-3 rounded-lg border border-slate-700/30 hover:border-indigo-500/30 transition-all"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                        <span>{ingredient}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setShowMealTypeDialog(true)}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 inline-flex items-center"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Add to Food Diary
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Detailed Instructions */}
              {activeSection === "instructions" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 shadow-lg"
                >
                  <h2 className="text-xl font-bold flex items-center mb-6">
                    <ChefHat className="mr-2 h-5 w-5 text-indigo-400" />
                    Instructions
                  </h2>

                  <div className="space-y-6">
                    {recipe.instructions.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="bg-slate-900/30 rounded-lg p-5 border border-slate-700/30 hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-white/90 mt-1.5">{step}</p>
                        </div>
                        {index < recipe.instructions.length - 1 && (
                          <div className="ml-5 h-8 border-l border-dashed border-slate-700/50"></div>
                        )}
                      </motion.div>
                    ))}

                    <div className="mt-8 flex flex-wrap gap-4 justify-center">
                      <button
                        onClick={() => setChatOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 inline-flex items-center"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Ask Anna AI About This Recipe
                      </button>

                      <button
                        onClick={shareRecipe}
                        className="px-6 py-3 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg text-white font-medium transition-all border border-slate-700/50 inline-flex items-center"
                      >
                        <Share2 className="mr-2 h-5 w-5" />
                        Share Recipe
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Detailed Nutrition Facts */}
              {activeSection === "nutrition" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-6"
                >
                  {/* Detailed nutritional info */}
                  <div className="md:col-span-7">
                    <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 shadow-lg">
                      <h2 className="text-xl font-bold flex items-center mb-6">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-indigo-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a3 3 0 00-3 3v2H7a1 1 0 000 2h1v1a1 1 0 01-1 1 1 1 0 100 2h6a1 1 0 100-2H9.83c.11-.313.17-.65.17-1v-1h1a1 1 0 100-2h-1V7a1 1 0 112 0 1 1 0 102 0 3 3 0 00-3-3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Nutrition Facts
                      </h2>

                      <p className="text-sm text-slate-300 mb-4">
                        Nutritional values per serving. This recipe makes{" "}
                        {recipe.servings} servings.
                      </p>

                      {/* Nutrition label styling */}
                      <div className="border-t-8 border-b-4 border-slate-300/30 py-2 mb-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-xl text-white">
                            Calories
                          </span>
                          <span className="font-bold text-xl text-white">
                            {recipe.nutritionFacts.calories}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Nutrient Breakdown */}
                      <div className="space-y-3">
                        <div className="border-b border-slate-700/50 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">
                              Total Fat
                            </span>
                            <span className="text-white">
                              {recipe.nutritionFacts.fat}g
                            </span>
                          </div>
                          <div className="pl-4 text-sm text-slate-400">
                            <div className="flex justify-between">
                              <span>Saturated Fat</span>
                              <span>
                                {Math.round(recipe.nutritionFacts.fat * 0.3)}g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Trans Fat</span>
                              <span>0g</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-b border-slate-700/50 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">
                              Total Carbohydrates
                            </span>
                            <span className="text-white">
                              {recipe.nutritionFacts.carbs}g
                            </span>
                          </div>
                          <div className="pl-4 text-sm text-slate-400">
                            <div className="flex justify-between">
                              <span>Dietary Fiber</span>
                              <span>
                                {Math.round(recipe.nutritionFacts.carbs * 0.1)}g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sugars</span>
                              <span>
                                {Math.round(recipe.nutritionFacts.carbs * 0.2)}g
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-b border-slate-700/50 py-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">
                              Protein
                            </span>
                            <span className="text-white">
                              {recipe.nutritionFacts.protein}g
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Macronutrient distribution chart */}
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">
                          Macronutrient Breakdown
                        </h3>
                        <div className="h-8 bg-slate-800/50 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              width: `${Math.round(
                                ((recipe.nutritionFacts.protein * 4) /
                                  recipe.nutritionFacts.calories) *
                                  100
                              )}%`,
                            }}
                          >
                            {Math.round(
                              ((recipe.nutritionFacts.protein * 4) /
                                recipe.nutritionFacts.calories) *
                                100
                            )}
                            %
                          </div>
                          <div
                            className="h-full bg-teal-600 flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              width: `${Math.round(
                                ((recipe.nutritionFacts.carbs * 4) /
                                  recipe.nutritionFacts.calories) *
                                  100
                              )}%`,
                            }}
                          >
                            {Math.round(
                              ((recipe.nutritionFacts.carbs * 4) /
                                recipe.nutritionFacts.calories) *
                                100
                            )}
                            %
                          </div>
                          <div
                            className="h-full bg-amber-600 flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              width: `${Math.round(
                                ((recipe.nutritionFacts.fat * 9) /
                                  recipe.nutritionFacts.calories) *
                                  100
                              )}%`,
                            }}
                          >
                            {Math.round(
                              ((recipe.nutritionFacts.fat * 9) /
                                recipe.nutritionFacts.calories) *
                                100
                            )}
                            %
                          </div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>
                            <span>
                              Protein ({recipe.nutritionFacts.protein}g)
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-teal-600 mr-1"></div>
                            <span>Carbs ({recipe.nutritionFacts.carbs}g)</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-amber-600 mr-1"></div>
                            <span>Fat ({recipe.nutritionFacts.fat}g)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nutritional insights */}
                  <div className="md:col-span-5">
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-md rounded-xl border border-indigo-500/20 p-6 shadow-lg">
                      <h2 className="text-xl font-bold flex items-center mb-6">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-indigo-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        Nutritional Insights
                      </h2>

                      <div className="space-y-4">
                        <div className="bg-slate-900/30 rounded-lg p-4 border border-indigo-500/20 hover:border-indigo-500/40 transition-all">
                          <h3 className="font-medium text-indigo-400 mb-2">
                            Protein Content
                          </h3>
                          <p className="text-white/80 text-sm">
                            This recipe provides {recipe.nutritionFacts.protein}
                            g of protein per serving, which is{" "}
                            {Math.round(
                              (recipe.nutritionFacts.protein / 50) * 100
                            )}
                            % of the daily recommended intake.
                            {recipe.nutritionFacts.protein >= 25
                              ? "This is a high-protein meal, great for muscle recovery and growth."
                              : "Consider pairing with another protein source to make a complete meal."}
                          </p>
                        </div>

                        <div className="bg-slate-900/30 rounded-lg p-4 border border-indigo-500/20 hover:border-indigo-500/40 transition-all">
                          <h3 className="font-medium text-indigo-400 mb-2">
                            Caloric Content
                          </h3>
                          <p className="text-white/80 text-sm">
                            At {recipe.nutritionFacts.calories} calories per
                            serving, this recipe represents about{" "}
                            {Math.round(
                              (recipe.nutritionFacts.calories / 2000) * 100
                            )}
                            % of a 2,000-calorie diet.
                            {recipe.nutritionFacts.calories > 600
                              ? "This is a substantial meal that can serve as a main dish."
                              : "This could work well as a lighter meal or side dish."}
                          </p>
                        </div>

                        <div className="bg-slate-900/30 rounded-lg p-4 border border-indigo-500/20 hover:border-indigo-500/40 transition-all">
                          <h3 className="font-medium text-indigo-400 mb-2">
                            Carb-to-Protein Ratio
                          </h3>
                          <p className="text-white/80 text-sm">
                            The ratio of carbs to protein is{" "}
                            {(
                              recipe.nutritionFacts.carbs /
                              recipe.nutritionFacts.protein
                            ).toFixed(1)}
                            :1.
                            {recipe.nutritionFacts.carbs /
                              recipe.nutritionFacts.protein >
                            3
                              ? "This meal is relatively high in carbohydrates compared to protein."
                              : "This meal has a balanced carb-to-protein ratio."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={() => setShowMealTypeDialog(true)}
                          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white flex items-center justify-center hover:opacity-90 transition-all"
                        >
                          <Calendar className="mr-2 h-5 w-5" />
                          Save to Food Diary
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Chef's Tips */}
              {activeSection === "tips" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 backdrop-blur-md rounded-xl border border-indigo-500/20 p-6 shadow-lg"
                >
                  <h2 className="text-xl font-bold flex items-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Chef's Tips and Advice
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recipe.tips.map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-slate-900/30 p-4 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 transition-all"
                      >
                        <div className="flex items-start gap-3 text-white/90">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{tip}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setChatOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 inline-flex items-center"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Ask for More Cooking Tips
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Related Recipes */}
              {relatedRecipes.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <ChefHat className="mr-2 h-6 w-6 text-indigo-400" />
                    You Might Also Like
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedRecipes.map((relatedRecipe, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ y: -10, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl hover:border-indigo-500/30 transition-all h-full"
                        onClick={() => searchRecipe(relatedRecipe.name)}
                      >
                        <div className="h-40 relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center overflow-hidden">
    {/* Animated background elements */}
    {[...Array(8)].map((_, j) => (
      <div 
        key={j}
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
    <ChefHat className="h-16 w-16 text-white/20" />
  </div>
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
  <div className="absolute bottom-3 right-3">
    <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium border border-slate-600/50">
      {relatedRecipe.difficulty}
    </div>
  </div>
</div>

                        <div className="p-4">
                          <h3 className="text-white font-medium text-lg mb-1">
                            {relatedRecipe.name}
                          </h3>
                          <p className="text-slate-300 text-sm line-clamp-2 mb-3">
                            {relatedRecipe.description}
                          </p>

                          <div className="flex items-center text-xs text-slate-400">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{relatedRecipe.totalTime} min</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Meal Type Dialog */}
      {showMealTypeDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Add to Food Diary
            </h3>

            <p className="text-slate-300 mb-6 text-center">
              Select which meal this recipe belongs to:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {["breakfast", "lunch", "dinner", "snack"].map((meal) => (
                <motion.button
                  key={meal}
                  onClick={() => saveToFoodDiary(meal)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 hover:border-indigo-500/50 rounded-lg text-white capitalize hover:shadow-lg transition-all"
                  disabled={savingToDiary}
                >
                  {savingToDiary ? (
                    <div className="flex justify-center items-center">
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    meal
                  )}
                </motion.button>
              ))}
            </div>

            <button
              onClick={() => setShowMealTypeDialog(false)}
              className="w-full py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800/50 transition-colors"
              disabled={savingToDiary}
            >
              Cancel
            </button>
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
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mt-4 mb-2">
                Recipe Copied!
              </h3>
              <p className="text-slate-300 mb-6">
                Recipe details have been copied to your clipboard. You can now
                share it with your friends.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShareModalOpen(false)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium"
            >
              Done
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Anna AI Cook Chat Modal */}
      <AnimatePresence>
        {chatOpen && !chatFullscreen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-slate-900/80 to-black/80 backdrop-blur-xl rounded-2xl w-full max-w-2xl h-3/4 border border-slate-700/50 overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-lg px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3">
                      <ChefHat className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Anna AI Cook</h3>
                      <p className="text-sm text-white/60">
                        Your personal cooking assistant
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChatFullscreen(true)}
                      className="p-2 rounded-full hover:bg-slate-800/50 text-white/70 hover:text-white transition-all"
                    >
                      <Fullscreen className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setChatOpen(false)}
                      className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800/50"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mb-4">
                        <ChefHat className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">
                        Welcome to Anna AI Cook
                      </h3>
                      <p className="text-white/70 max-w-md">
                        Ask me anything about cooking, recipes, ingredients, or
                        techniques. I'm here to help make your cooking
                        experience delightful!
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
                        {[
                          "How do I make this recipe vegetarian?",
                          "What can I substitute for eggs?",
                          "How can I make this spicier?",
                          "What wine pairs with this dish?",
                        ].map((question, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setUserMessage(question);
                              setTimeout(() => sendMessage(), 100);
                            }}
                            className="bg-slate-800/70 hover:bg-indigo-800/70 rounded-lg px-3 py-2 text-sm text-left transition-colors border border-slate-700/50 hover:border-indigo-500/50"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            msg.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-3/4 rounded-2xl px-4 py-3 ${
                              msg.role === "user"
                                ? "bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white rounded-tr-none"
                                : "bg-slate-800/70 text-white rounded-tl-none border border-slate-700/50"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </motion.div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3">
                            <div className="flex space-x-2">
                              <div
                                className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
                                style={{ animationDelay: "200ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
                                style={{ animationDelay: "400ms" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Ask Anna AI Cook..."
                      className="w-full bg-slate-800/70 border border-slate-700/50 rounded-full py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={chatLoading || !userMessage.trim()}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-3 hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v18"
                          transform="rotate(90 12 12)"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Anna AI Cook Fullscreen Mode */}
      {chatOpen && chatFullscreen && (
        <div
          ref={chatContainerRef}
          className="fixed inset-0 z-50 bg-gradient-to-b from-[#070B14] via-[#0b1120] to-[#0A0E1A] text-white overflow-y-auto"
        >
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

          {/* Animated glowing orb */}
          <div className="fixed top-1/4 -right-28 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
          <div className="fixed top-3/4 -left-28 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>

          {/* Header */}
          <header className="sticky top-0 z-10 backdrop-blur-xl bg-gradient-to-r from-black/80 via-black/70 to-black/80 border-b border-slate-800/60 shadow-lg">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <button
                    onClick={() => setChatFullscreen(false)}
                    className="p-2 rounded-full hover:bg-slate-800/60 transition-colors mr-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3">
                      <ChefHat className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="font-bold text-xl md:text-2xl bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                        Anna AI Cook
                      </h1>
                      <p className="text-sm text-white/60">
                        Your AI Cooking Assistant
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setChatOpen(false);
                    setChatFullscreen(false);
                  }}
                  className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8 max-w-3xl">
            {/* Recipe info */}
            {recipe && (
              <div className="mb-8 bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-5 shadow-lg">
                <h2 className="text-lg font-medium text-white mb-2">
                  Currently Discussing:
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-indigo-600/40 rounded-lg flex items-center justify-center text-2xl">
                    <ChefHat className="h-6 w-6 text-white/80" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{recipe.name}</h3>
                    <p className="text-sm text-slate-300">
                      {recipe.cuisine} • {recipe.difficulty} •{" "}
                      {recipe.totalTime} min
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat content */}
            <div className="space-y-6 pb-20">
              {chatMessages.length === 0 ? (
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 shadow-lg text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mb-4">
                    <ChefHat className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">
                    Welcome to Anna AI Cook
                  </h3>
                  <p className="text-white/70 max-w-lg mx-auto mb-8">
                    I'm your personal cooking assistant. Ask me anything about
                    recipes, ingredients, cooking techniques, or meal planning.
                    If you're viewing a specific recipe, I can help with
                    substitutions, variations, or troubleshooting.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {[
                      "How do I make this recipe vegetarian?",
                      "What can I substitute for eggs?",
                      "How can I make this spicier?",
                      "What wine pairs with this dish?",
                      "How do I know when it's properly cooked?",
                      "Can I prepare parts of this in advance?",
                    ].map((question, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setUserMessage(question);
                          setTimeout(() => sendMessage(), 100);
                        }}
                        className="bg-slate-800/70 hover:bg-indigo-800/70 rounded-lg px-4 py-3 text-left transition-colors border border-slate-700/50 hover:border-indigo-500/50 hover:shadow-lg"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {chatMessages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0 flex items-center justify-center mr-3 mt-1">
                          <ChefHat className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-2xl rounded-2xl px-5 py-4 ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white rounded-tr-none"
                            : "bg-slate-800/70 text-white rounded-tl-none border border-slate-700/50"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-10 h-10 rounded-full bg-slate-700/70 flex-shrink-0 flex items-center justify-center ml-3 mt-1">
                          <User className="h-5 w-5 text-white/70" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0 flex items-center justify-center mr-3 mt-1">
                        <ChefHat className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl rounded-tl-none px-5 py-4">
                        <div className="flex space-x-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full bg-white/40 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2.5 h-2.5 rounded-full bg-white/40 animate-bounce"
                            style={{ animationDelay: "200ms" }}
                          ></div>
                          <div
                            className="w-2.5 h-2.5 rounded-full bg-white/40 animate-bounce"
                            style={{ animationDelay: "400ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fixed Chat Input */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-black/80 via-black/80 to-black/80 backdrop-blur-xl p-4 border-t border-slate-700/50">
              <div className="container mx-auto max-w-3xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    ref={chatInputRef}
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask Anna AI Cook anything about cooking..."
                    className="w-full bg-slate-800/70 border border-slate-700/50 rounded-full py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={chatLoading || !userMessage.trim()}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-3 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                        transform="rotate(90 12 12)"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Anna AI Cook Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-4 shadow-lg hover:opacity-90 transition-opacity z-40"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      )}

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

        /* Hide scrollbar but allow scrolling */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}
