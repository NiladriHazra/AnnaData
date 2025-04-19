"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useUserData } from "./userData";
import { useAIInsights } from "./aiInsights";
import {
  Filter,
  Play,
  Dumbbell,
  BookOpen,
  ArrowLeft,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit2,
  GitFork,
  Heart,
  Home as HomeIcon,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  MoreHorizontal,
  PieChart,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Share2,
  Shield,
  Star,
  Trash2,
  Trash,
  TrendingUp,
  Trophy,
  User,
  Users,
  X,
  Calendar,
  Clock,
  ChefHat,
  Award,
  BarChart2,
  Target,
  Box,
  Download,
  Image,
  Upload,
  Link,
  AlertCircle,
  Check,
  Zap,
  ThumbsUp,
  ChevronUp,
  Paintbrush,
  Loader,
  Bell,
  Activity,
  FileText,
  HelpCircle,
  Book,
  Globe,
  Coffee,
  Bookmark,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as ReChartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from "recharts";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ""
);

// Theme colors
const THEME_COLORS = {
  primary: {
    from: "indigo-600",
    to: "purple-600",
    textFrom: "indigo-400",
    textTo: "purple-500",
  },
  teal: {
    from: "teal-600",
    to: "emerald-600",
    textFrom: "teal-400",
    textTo: "emerald-500",
  },
  amber: {
    from: "amber-600",
    to: "orange-600",
    textFrom: "amber-400",
    textTo: "orange-500",
  },
  rose: {
    from: "rose-600",
    to: "pink-600",
    textFrom: "rose-400",
    textTo: "pink-500",
  },
  blue: {
    from: "blue-600",
    to: "cyan-600",
    textFrom: "blue-400",
    textTo: "cyan-500",
  },
};

// Chart colors
const CHART_COLORS = {
  primary: "#6366f1",
  secondary: "#a855f7",
  tertiary: "#ec4899",
  quaternary: "#0ea5e9",
  quinary: "#10b981",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

// Sample data for achievements
const ACHIEVEMENTS = [
  {
    id: 1,
    name: "First Recipe Saved",
    icon: <ChefHat size={24} />,
    description: "You saved your first recipe",
    unlockedAt: "2025-02-15",
    progress: 1,
    target: 1,
    color: "blue",
  },
  {
    id: 2,
    name: "Week Streak",
    icon: <Calendar size={24} />,
    description: "Log in for 7 consecutive days",
    unlockedAt: "2025-03-01",
    progress: 7,
    target: 7,
    color: "green",
  },
  {
    id: 3,
    name: "Nutrition Master",
    icon: <Award size={24} />,
    description: "Track your nutrition for 30 days",
    unlockedAt: null,
    progress: 18,
    target: 30,
    color: "purple",
  },
  {
    id: 4,
    name: "Fitness Enthusiast",
    icon: <Activity size={24} />,
    description: "Complete 20 workouts",
    unlockedAt: null,
    progress: 12,
    target: 20,
    color: "orange",
  },
  {
    id: 5,
    name: "Healthy Habits",
    icon: <Heart size={24} />,
    description: "Complete all daily goals for a week",
    unlockedAt: "2025-03-18",
    progress: 7,
    target: 7,
    color: "red",
  },
  {
    id: 6,
    name: "Recipe Creator",
    icon: <ChefHat size={24} />,
    description: "Create your first custom recipe",
    unlockedAt: null,
    progress: 0,
    target: 1,
    color: "yellow",
  },
  {
    id: 7,
    name: "Fitness Planner",
    icon: <Target size={24} />,
    description: "Create a custom workout plan",
    unlockedAt: null,
    progress: 0,
    target: 1,
    color: "indigo",
  },
  {
    id: 8,
    name: "Social Butterfly",
    icon: <Users size={24} />,
    description: "Connect with 5 friends",
    unlockedAt: null,
    progress: 2,
    target: 5,
    color: "cyan",
  },
  {
    id: 9,
    name: "Data Analyst",
    icon: <BarChart2 size={24} />,
    description: "View your analytics for 14 days",
    unlockedAt: null,
    progress: 8,
    target: 14,
    color: "teal",
  },
  {
    id: 10,
    name: "Premium Member",
    icon: <Star size={24} />,
    description: "Subscribe to AnnaData Premium",
    unlockedAt: "2025-01-30",
    progress: 1,
    target: 1,
    color: "amber",
  },
  {
    id: 11,
    name: "Workout Warrior",
    icon: <Zap size={24} />,
    description: "Burn 10,000 total calories",
    unlockedAt: null,
    progress: 7540,
    target: 10000,
    color: "emerald",
  },
  {
    id: 12,
    name: "Meal Planner",
    icon: <FileText size={24} />,
    description: "Create 10 meal plans",
    unlockedAt: null,
    progress: 4,
    target: 10,
    color: "violet",
  },
];

// Custom hook for user data with MongoDB integration
const useUserData = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real implementation, you would fetch from MongoDB
        // For now, simulate with localStorage + default values
        const savedUser = localStorage.getItem("userData");

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          // Default user data
          const defaultUser = {
            _id: "user_123456789",
            name: "Anna Smith",
            email: "anna@example.com",
            username: "anna_nutrition",
            profileImage:
              "https://ui-avatars.com/api/?name=Anna+Smith&background=6366f1&color=fff&size=150",
            bio: "Nutrition enthusiast and fitness lover. Using AnnaData to track my health journey!",
            createdAt: "2025-01-15T08:30:00Z",
            location: "New York, USA",
            theme: "primary",
            settings: {
              emailNotifications: true,
              pushNotifications: true,
              weeklyReports: true,
              darkMode: true,
              language: "english",
              unitSystem: "metric",
              privacyMode: "friends",
            },
            stats: {
              totalRecipes: 42,
              totalWorkouts: 28,
              daysTracked: 65,
              goalsMet: 18,
              streakDays: 14,
              caloriesBurned: 15400,
              nutritionScore: 82,
            },
            achievements: ACHIEVEMENTS.slice(0, 5).map((a) => a.id),
            goals: [
              {
                id: 1,
                name: "Lose Weight",
                target: "5 kg in 3 months",
                progress: 60,
                startDate: "2025-02-01T00:00:00Z",
                endDate: "2025-05-01T00:00:00Z",
                type: "weight",
              },
              {
                id: 2,
                name: "Run 5K",
                target: "Under 30 minutes",
                progress: 75,
                startDate: "2025-03-01T00:00:00Z",
                endDate: "2025-04-15T00:00:00Z",
                type: "fitness",
              },
              {
                id: 3,
                name: "Meal Prep",
                target: "Weekly meal planning",
                progress: 40,
                startDate: "2025-03-15T00:00:00Z",
                endDate: "2025-04-30T00:00:00Z",
                type: "nutrition",
              },
            ],
            healthData: {
              weight: [
                { date: "2025-01-15", value: 74.5 },
                { date: "2025-01-22", value: 73.8 },
                { date: "2025-01-29", value: 73.2 },
                { date: "2025-02-05", value: 72.9 },
                { date: "2025-02-12", value: 72.1 },
                { date: "2025-02-19", value: 71.5 },
                { date: "2025-02-26", value: 71.2 },
                { date: "2025-03-05", value: 70.8 },
                { date: "2025-03-12", value: 70.5 },
                { date: "2025-03-19", value: 70.2 },
                { date: "2025-03-26", value: 69.8 },
                { date: "2025-04-02", value: 69.5 },
                { date: "2025-04-09", value: 69.2 },
                { date: "2025-04-16", value: 68.9 },
              ],
              caloriesConsumed: [
                { date: "2025-04-12", value: 1950 },
                { date: "2025-04-13", value: 2100 },
                { date: "2025-04-14", value: 1840 },
                { date: "2025-04-15", value: 2050 },
                { date: "2025-04-16", value: 1920 },
                { date: "2025-04-17", value: 2200 },
                { date: "2025-04-18", value: 1880 },
              ],
              caloriesBurned: [
                { date: "2025-04-12", value: 350 },
                { date: "2025-04-13", value: 420 },
                { date: "2025-04-14", value: 280 },
                { date: "2025-04-15", value: 520 },
                { date: "2025-04-16", value: 380 },
                { date: "2025-04-17", value: 450 },
                { date: "2025-04-18", value: 400 },
              ],
              macros: [
                { name: "Protein", value: 25 },
                { name: "Carbs", value: 50 },
                { name: "Fat", value: 25 },
              ],
              workoutMinutes: [
                { date: "2025-04-12", value: 45 },
                { date: "2025-04-13", value: 60 },
                { date: "2025-04-14", value: 30 },
                { date: "2025-04-15", value: 75 },
                { date: "2025-04-16", value: 45 },
                { date: "2025-04-17", value: 60 },
                { date: "2025-04-18", value: 50 },
              ],
              sleepHours: [
                { date: "2025-04-12", value: 7.5 },
                { date: "2025-04-13", value: 6.8 },
                { date: "2025-04-14", value: 8.2 },
                { date: "2025-04-15", value: 7.4 },
                { date: "2025-04-16", value: 7.8 },
                { date: "2025-04-17", value: 6.5 },
                { date: "2025-04-18", value: 7.2 },
              ],
            },
            socialConnections: {
              friends: 8,
              recipes_shared: 17,
              workouts_shared: 12,
            },
            recentActivity: [
              {
                id: 1,
                type: "recipe",
                action: "saved",
                name: "Grilled Salmon with Quinoa",
                date: "2025-04-18T15:45:00Z",
              },
              {
                id: 2,
                type: "workout",
                action: "completed",
                name: "HIIT Circuit Training",
                date: "2025-04-18T08:30:00Z",
              },
              {
                id: 3,
                type: "goal",
                action: "achieved",
                name: "Weekly Steps Goal",
                date: "2025-04-17T21:15:00Z",
              },
              {
                id: 4,
                type: "recipe",
                action: "shared",
                name: "Avocado Toast Variations",
                date: "2025-04-16T12:20:00Z",
              },
              {
                id: 5,
                type: "nutrition",
                action: "tracked",
                name: "Complete Daily Log",
                date: "2025-04-15T22:10:00Z",
              },
              {
                id: 6,
                type: "weight",
                action: "recorded",
                name: "Weekly Weigh-in",
                date: "2025-04-14T08:00:00Z",
              },
              {
                id: 7,
                type: "workout",
                action: "created",
                name: "Custom Strength Plan",
                date: "2025-04-13T16:45:00Z",
              },
            ],
            savedRecipes: [
              {
                id: 101,
                name: "Grilled Salmon with Quinoa",
                image: "salmon-quinoa.jpg",
                type: "dinner",
                saved: "2025-04-18T15:45:00Z",
              },
              {
                id: 102,
                name: "Avocado Toast Variations",
                image: "avocado-toast.jpg",
                type: "breakfast",
                saved: "2025-04-16T12:20:00Z",
              },
              {
                id: 103,
                name: "Greek Yogurt Parfait",
                image: "yogurt-parfait.jpg",
                type: "snack",
                saved: "2025-04-14T09:30:00Z",
              },
              {
                id: 104,
                name: "Chicken Stir Fry",
                image: "chicken-stir-fry.jpg",
                type: "dinner",
                saved: "2025-04-12T18:15:00Z",
              },
              {
                id: 105,
                name: "Protein Smoothie Bowl",
                image: "smoothie-bowl.jpg",
                type: "breakfast",
                saved: "2025-04-10T07:45:00Z",
              },
              {
                id: 106,
                name: "Mediterranean Salad",
                image: "med-salad.jpg",
                type: "lunch",
                saved: "2025-04-08T13:20:00Z",
              },
            ],
            favoriteWorkouts: [
              {
                id: 201,
                name: "HIIT Circuit Training",
                duration: 45,
                type: "cardio",
                lastPerformed: "2025-04-18T08:30:00Z",
              },
              {
                id: 202,
                name: "Upper Body Strength",
                duration: 60,
                type: "strength",
                lastPerformed: "2025-04-16T07:45:00Z",
              },
              {
                id: 203,
                name: "Yoga Flow",
                duration: 30,
                type: "flexibility",
                lastPerformed: "2025-04-15T19:00:00Z",
              },
              {
                id: 204,
                name: "5K Run",
                duration: 28,
                type: "cardio",
                lastPerformed: "2025-04-13T08:15:00Z",
              },
            ],
            subscriptionTier: "premium",
            subscriptionExpiry: "2025-12-31T23:59:59Z",
            lastLogin: "2025-04-19T07:30:00Z",
          };

          setUser(defaultUser);
          localStorage.setItem("userData", JSON.stringify(defaultUser));
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUser = useCallback(
    async (updatedData) => {
      try {
        setSaving(true);

        // In a real implementation, you would call your MongoDB API
        // For now, we'll just update localStorage

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const newUserData = { ...user, ...updatedData };

        // Update local state
        setUser(newUserData);

        // Save to localStorage
        localStorage.setItem("userData", JSON.stringify(newUserData));

        return { success: true };
      } catch (err) {
        console.error("Error updating user data:", err);
        setError("Failed to update profile. Please try again.");
        return { success: false, error: err.message };
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFormattedCreationDate = () => {
    if (!user?.createdAt) return "";
    return formatDate(user.createdAt);
  };

  const calculateMembershipDuration = () => {
    if (!user?.createdAt) return "";

    const createdDate = new Date(user.createdAt);
    const now = new Date();

    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);

      if (remainingMonths === 0) {
        return `${years} ${years === 1 ? "year" : "years"}`;
      } else {
        return `${years} ${
          years === 1 ? "year" : "years"
        }, ${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
      }
    }
  };

  return {
    user,
    loading,
    error,
    saving,
    updateUser,
    formatDate,
    getFormattedCreationDate,
    calculateMembershipDuration,
  };
};

// Custom hook for AI insights
const useAIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateInsights = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Use Gemini to generate insights based on user data
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Prepare user data for prompt, excluding sensitive data
      const userDataForPrompt = {
        stats: userData.stats,
        goals: userData.goals,
        healthData: userData.healthData,
        achievements: userData.achievements?.length || 0,
      };

      const prompt = `
        I need you to analyze this fitness and nutrition user data and provide 4 brief, specific insights. Each insight should be 1-2 sentences max.
        
        User Data:
        ${JSON.stringify(userDataForPrompt)}
        
        Generate the following:
        1. A personalized insight about recent nutrition patterns
        2. A specific observation about their fitness activities
        3. A goal-related insight on their progress
        4. A recommendation based on their health trends
        
        Format your response in this exact JSON structure, with each insight being a brief, motivating 1-2 sentence message:
        {
          "nutrition": "Your insight here",
          "fitness": "Your insight here",
          "goals": "Your insight here",
          "recommendation": "Your insight here"
        }
        
        Be realistic, motivating, and VERY concise. Do not add ANY additional text outside the JSON.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      try {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        const parsedInsights = JSON.parse(jsonString);

        setInsights(parsedInsights);

        // Cache the insights for future use
        localStorage.setItem(
          "userInsights",
          JSON.stringify({
            timestamp: new Date().toISOString(),
            insights: parsedInsights,
          })
        );

        return parsedInsights;
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError, text);
        throw new Error("Failed to process AI insights");
      }
    } catch (err) {
      console.error("Error generating AI insights:", err);
      setError("Failed to generate insights. Please try again later.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try to load cached insights on initial load
    try {
      const cachedInsights = localStorage.getItem("userInsights");
      if (cachedInsights) {
        const { timestamp, insights: cachedInsightsData } =
          JSON.parse(cachedInsights);

        // Check if insights are still fresh (less than 24 hours old)
        const cacheTime = new Date(timestamp).getTime();
        const now = new Date().getTime();
        const cacheAge = now - cacheTime;

        if (cacheAge < 24 * 60 * 60 * 1000) {
          // 24 hours
          setInsights(cachedInsightsData);
        }
      }
    } catch (err) {
      console.error("Error loading cached insights:", err);
    }
  }, []);

  return { insights, loading, error, generateInsights };
};

// Profile picture uploader component
const ProfilePictureUploader = ({ currentImage, onUpdate, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerFileInput = () => {
    inputRef.current?.click();
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      // In a real implementation, you would upload the file to a storage service
      // and get a URL back. For now, we'll just use the data URL.

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Call the onUpdate function with the new image URL
      onUpdate(previewUrl);

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCurrentPhoto = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
          Update Profile Picture
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-800/70"
        >
          <X size={20} />
        </button>
      </div>

      {/* Current/preview image */}
      <div className="flex flex-col items-center mb-6">
        {previewUrl ? (
          <div className="relative rounded-full w-32 h-32 overflow-hidden mb-4 group">
            <img
              src={previewUrl}
              alt="Profile Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleRemoveCurrentPhoto}
                className="p-2 rounded-full bg-red-600/80 text-white hover:bg-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
            <User size={48} />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleTriggerFileInput}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors flex items-center justify-center"
        >
          <Upload size={16} className="mr-2" />
          {previewUrl ? "Change Photo" : "Upload Photo"}
        </button>

        <p className="text-xs text-slate-400 mt-2">
          JPEG, PNG or GIF. Max 5MB.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!selectedFile || uploading}
          className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-medium transition-colors flex items-center justify-center"
        >
          {uploading ? (
            <>
              <Loader size={16} className="mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Save Photo
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Achievement card component
const AchievementCard = ({ achievement, isUnlocked }) => {
  return (
    <div
      className={`bg-gradient-to-br ${
        isUnlocked
          ? `from-${achievement.color}-600/30 to-${achievement.color}-900/30 border-${achievement.color}-500/30`
          : "from-slate-700/20 to-slate-900/20 border-slate-700/30"
      } backdrop-blur-sm rounded-xl p-4 border relative overflow-hidden`}
    >
      {/* Achievement icon */}
      <div className="flex justify-center mb-3">
        <div
          className={`w-16 h-16 rounded-full ${
            isUnlocked ? `bg-${achievement.color}-600/20` : "bg-slate-800/50"
          } flex items-center justify-center`}
        >
          <div
            className={
              isUnlocked ? `text-${achievement.color}-400` : "text-slate-500"
            }
          >
            {achievement.icon}
          </div>
        </div>
      </div>

      {/* Achievement details */}
      <div className="text-center mb-3">
        <h3
          className={`font-bold ${
            isUnlocked ? "text-white" : "text-slate-400"
          }`}
        >
          {achievement.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1">{achievement.description}</p>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute top-0 left-0 h-full ${
            isUnlocked ? `bg-${achievement.color}-500` : "bg-slate-600"
          } rounded-full`}
          style={{
            width: `${Math.min(
              (achievement.progress / achievement.target) * 100,
              100
            )}%`,
          }}
        ></div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <div className="text-slate-400">
          {achievement.progress}/{achievement.target}
        </div>
        <div
          className={
            isUnlocked ? `text-${achievement.color}-400` : "text-slate-500"
          }
        >
          {isUnlocked ? (
            <div className="flex items-center">
              <CheckCircle size={12} className="mr-1" />
              Unlocked{" "}
              {achievement.unlockedAt
                ? ` on ${new Date(achievement.unlockedAt).toLocaleDateString()}`
                : ""}
            </div>
          ) : (
            <div className="flex items-center">
              <Lock size={12} className="mr-1" />
              Locked
            </div>
          )}
        </div>
      </div>

      {/* Sparkles for unlocked achievements */}
      {isUnlocked && (
        <>
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400/20 to-orange-400/10 rounded-full blur-lg"></div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-yellow-400/10 to-orange-400/5 rounded-full blur-md"></div>
        </>
      )}
    </div>
  );
};

// Main Profile Page Component
export default function ProfilePage() {
    const router = useRouter();
    const {
      user,
      loading,
      error,
      saving,
      updateUser,
      updateAchievement,
      formatDate,
      getFormattedCreationDate,
      calculateMembershipDuration,
    } = useUserData();
    const {
      insights,
      loading: insightsLoading,
      error: insightsError,
      generateInsights,
    } = useAIInsights();

    const [activeTab, setActiveTab] = useState("overview");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editableUser, setEditableUser] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Initialize editable user when user data is loaded
  useEffect(() => {
    if (user) {
      setEditableUser({ ...user });
    }
  }, [user]);

  // Generate AI insights when user data is available
  useEffect(() => {
    if (user && !insights && !insightsLoading) {
      generateInsights(user);
    }
  }, [user, insights, insightsLoading, generateInsights]);

  // Format user achievements
  const userAchievements = useMemo(() => {
    if (!user) return [];

    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      isUnlocked: user.achievements?.includes(achievement.id),
    }));
  }, [user]);

  // Unlocked and locked achievements
  const unlockedAchievements = useMemo(
    () => userAchievements.filter((a) => a.isUnlocked),
    [userAchievements]
  );

  const lockedAchievements = useMemo(
    () => userAchievements.filter((a) => !a.isUnlocked),
    [userAchievements]
  );


  // Handle profile updates
  const handleSaveProfile = async () => {
    if (!editableUser) return;

    const result = await updateUser(editableUser);

    if (result.success) {
      setIsEditing(false);
    }
  };
  // Update profile picture
  const handleUpdateProfilePicture = async (newImageUrl) => {
    await updateUser({ profileImage: newImageUrl });
  };
  // Handle achievement toggle
  const handleToggleAchievement = async (achievementId, achieved) => {
    await updateAchievement(achievementId, achieved);
  };
// Handle theme change
const handleThemeChange = (themeKey) => {
    if (!editableUser) return;

    setEditableUser((prev) => ({
      ...prev,
      theme: themeKey,
    }));
  };

  // Delete account (simulated)
  const handleDeleteAccount = async () => {
    try {
      // In a real implementation, you would call your API to delete the account
      const response = await fetch('/api/profile/deleteAccount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Clear localStorage and navigate to home
      localStorage.removeItem("userData");
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  // Set up theme-specific gradient based on user preference
  const getThemeGradient = (type, theme = "primary") => {
    const themeColor = THEME_COLORS[theme] || THEME_COLORS.primary;

    if (type === "text") {
      return `from-${themeColor.textFrom} to-${themeColor.textTo}`;
    }

    return `from-${themeColor.from} to-${themeColor.to}`;
  };

  // Set subscription tag based on user tier
  const getSubscriptionTag = () => {
    if (!user) return null;

    let color = "bg-slate-700 text-slate-300";
    let text = "Free Plan";

    switch (user.subscriptionTier) {
      case "premium":
        color = "bg-gradient-to-r from-amber-600 to-yellow-500 text-white";
        text = "Premium";
        break;
      case "pro":
        color = "bg-gradient-to-r from-indigo-600 to-blue-500 text-white";
        text = "Pro";
        break;
      case "business":
        color = "bg-gradient-to-r from-emerald-600 to-teal-500 text-white";
        text = "Business";
        break;
      default:
        break;
    }

    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>
        {text}
      </span>
    );
  };

  // Format most active time from data
  const getMostActiveTime = () => {
    if (!user?.healthData?.workoutMinutes) return "Afternoon";

    // In a real app, we would analyze the workout data to find patterns
    // For now, just return a simulated analysis
    return "Morning";
  };

  // Calculate daily average for given health metric
  const calculateDailyAverage = (metricName) => {
    if (!user?.healthData?.[metricName]) return 0;

    const data = user.healthData[metricName];
    if (!data.length) return 0;

    const sum = data.reduce((total, item) => total + item.value, 0);
    return (sum / data.length).toFixed(1);
  };

  // Calculate user level based on activity
  const calculateUserLevel = () => {
    if (!user) return { level: 1, progress: 0 };

    // In a real app, we would calculate this based on activity
    // For now, simulate a level calculation

    const totalActivities =
      (user.stats?.totalRecipes || 0) +
      (user.stats?.totalWorkouts || 0) +
      unlockedAchievements.length;

    const level = Math.floor(totalActivities / 10) + 1;
    const progress = (totalActivities % 10) * 10;

    return { level, progress };
  };

  // Render UI components
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#070B14] via-[#0b1120] to-[#0A0E1A] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-indigo-600 border-indigo-600/30 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#070B14] via-[#0b1120] to-[#0A0E1A] flex items-center justify-center">
        <div className="bg-slate-800/50 p-6 rounded-xl max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Error Loading Profile
          </h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get user level
  const { level, progress } = calculateUserLevel();


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
                <span
                  className={`bg-gradient-to-r ${getThemeGradient(
                    "text",
                    user?.theme
                  )} text-transparent bg-clip-text`}
                >
                  Your Profile
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
                onClick={() => router.push("/recipe")}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Recipes
              </button>
              <button
                onClick={() => router.push("/fitness")}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <Activity className="mr-2 h-4 w-4" />
                Fitness
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
                onClick={() => {
                  router.push("/");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => {
                  router.push("/recipe");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Recipes
              </button>
              <button
                onClick={() => {
                  router.push("/fitness");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <Activity className="mr-2 h-4 w-4" />
                Fitness
              </button>
              <button
                onClick={() => {
                  router.push("/diary");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Food Diary
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Profile header section */}
      <section
        className={`bg-gradient-to-br from-slate-900/80 to-black/80 border-b border-slate-800/40`}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile picture */}
            <div className="relative group">
              <div
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-${
                  user?.theme || "indigo"
                }-600 overflow-hidden bg-slate-800 flex items-center justify-center`}
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-slate-400" />
                )}
              </div>

              {!isEditing && (
                <button
                  onClick={() => setShowProfilePictureModal(true)}
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={16} />
                </button>
              )}

              {/* User level badge */}
              <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 border-4 border-slate-900 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{level}</span>
              </div>
            </div>

            {/* Profile info */}
            <div className="text-center md:text-left flex-grow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h1 className="text-3xl font-bold text-white">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableUser?.name || ""}
                          onChange={(e) =>
                            setEditableUser((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1 text-2xl w-full md:w-auto"
                        />
                      ) : (
                        user.name
                      )}
                    </h1>

                    {getSubscriptionTag()}
                  </div>

                  <div className="text-slate-400 mt-1 flex flex-col md:flex-row items-center gap-2 md:gap-4">
                    <div className="flex items-center">
                      <User size={14} className="mr-1" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableUser?.username || ""}
                          onChange={(e) =>
                            setEditableUser((prev) => ({
                              ...prev,
                              username: e.target.value,
                            }))
                          }
                          className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-0.5 text-sm"
                        />
                      ) : (
                        <span>@{user.username}</span>
                      )}
                    </div>

                    <div className="flex items-center">
                      <Mail size={14} className="mr-1" />
                      {isEditing ? (
                        <input
                          type="email"
                          value={editableUser?.email || ""}
                          onChange={(e) =>
                            setEditableUser((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-0.5 text-sm"
                        />
                      ) : (
                        <span>{user.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 md:mt-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditableUser({ ...user });
                        }}
                        className="px-3 py-1.5 border border-slate-600 rounded-lg text-sm hover:bg-slate-800/50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className={`px-4 py-1.5 bg-gradient-to-r ${getThemeGradient(
                          "bg",
                          user?.theme
                        )} rounded-lg text-sm text-white flex items-center transition-all ${
                          saving ? "opacity-75" : "hover:opacity-90"
                        }`}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader size={14} className="mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={14} className="mr-1" />
                            Save Profile
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`px-4 py-1.5 border border-${
                        user?.theme || "indigo"
                      }-500/50 rounded-lg text-sm text-${
                        user?.theme || "indigo"
                      }-400 hover:bg-${
                        user?.theme || "indigo"
                      }-900/20 transition-colors flex items-center`}
                    >
                      <Edit2 size={14} className="mr-1" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-4 md:max-w-lg">
                {isEditing ? (
                  <textarea
                    value={editableUser?.bio || ""}
                    onChange={(e) =>
                      setEditableUser((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white w-full h-20"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-slate-300">{user.bio}</p>
                )}
              </div>

              {/* Additional info */}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 justify-center md:justify-start">
                {isEditing ? (
                  <div className="flex items-center">
                    <Globe size={14} className="mr-1.5" />
                    <input
                      type="text"
                      value={editableUser?.location || ""}
                      onChange={(e) =>
                        setEditableUser((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-0.5 text-sm"
                      placeholder="Location"
                    />
                  </div>
                ) : (
                  user.location && (
                    <div className="flex items-center">
                      <Globe size={14} className="mr-1.5" />
                      {user.location}
                    </div>
                  )
                )}

                <div className="flex items-center">
                  <Calendar size={14} className="mr-1.5" />
                  Joined {getFormattedCreationDate()}
                </div>

                <div className="flex items-center">
                  <Clock size={14} className="mr-1.5" />
                  Member for {calculateMembershipDuration()}
                </div>
              </div>
            </div>
          </div>

          {/* User stats bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 md:gap-4">
            <div
              className={`bg-gradient-to-br from-${
                user?.theme || "indigo"
              }-900/30 to-${user?.theme || "indigo"}-900/10 border border-${
                user?.theme || "indigo"
              }-500/30 rounded-lg p-3 text-center`}
            >
              <div className="text-2xl font-bold">
                {user.stats?.totalRecipes || 0}
              </div>
              <div className="text-xs text-slate-400">Recipes</div>
            </div>

            <div className="bg-gradient-to-br from-slate-900/40 to-slate-900/20 border border-slate-700/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">
                {user.stats?.totalWorkouts || 0}
              </div>
              <div className="text-xs text-slate-400">Workouts</div>
            </div>

            <div className="bg-gradient-to-br from-slate-900/40 to-slate-900/20 border border-slate-700/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">
                {user.stats?.daysTracked || 0}
              </div>
              <div className="text-xs text-slate-400">Days Tracked</div>
            </div>

            <div className="bg-gradient-to-br from-slate-900/40 to-slate-900/20 border border-slate-700/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">
                {user.stats?.goalsMet || 0}
              </div>
              <div className="text-xs text-slate-400">Goals Met</div>
            </div>

            <div className="bg-gradient-to-br from-amber-900/30 to-amber-900/10 border border-amber-500/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">
                {user.stats?.streakDays || 0}
              </div>
              <div className="text-xs text-slate-400">Day Streak</div>
            </div>

            <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 border border-red-500/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">
                {user.stats?.caloriesBurned?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-slate-400">Calories Burned</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-900/10 border border-emerald-500/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">
                {user.stats?.nutritionScore || 0}
              </div>
              <div className="text-xs text-slate-400">Nutrition Score</div>
            </div>
          </div>

          {/* User level progress bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1 text-sm">
              <div className="text-slate-400">Level {level}</div>
              <div className="text-slate-400">
                {progress}% to Level {level + 1}
              </div>
            </div>
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs navigation */}
      <div className="bg-slate-900/60 backdrop-blur-sm border-b border-slate-800/60 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: <PieChart size={16} />,
              },
              {
                id: "achievements",
                label: "Achievements",
                icon: <Trophy size={16} />,
              },
              {
                id: "activity",
                label: "Activity",
                icon: <TrendingUp size={16} />,
              },
              {
                id: "favorites",
                label: "Favorites",
                icon: <Heart size={16} />,
              },
              {
                id: "settings",
                label: "Settings",
                icon: <Settings size={16} />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 flex items-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? `text-white border-b-2 border-${
                        user?.theme || "indigo"
                      }-500 font-medium`
                    : "text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-700/50"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <div className="container mx-auto px-4 py-6 pb-20">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* AI Insights Section */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center">
                    <Zap
                      className={`mr-2 text-${user?.theme || "indigo"}-400`}
                    />
                    AI Powered Insights
                  </h2>

                  <button
                    onClick={() => generateInsights(user)}
                    className="p-2 rounded-lg hover:bg-slate-800/70 transition-colors text-slate-400 hover:text-white flex items-center text-xs"
                    disabled={insightsLoading}
                  >
                    {insightsLoading ? (
                      <Loader size={14} className="animate-spin mr-1" />
                    ) : (
                      <RefreshCw size={14} className="mr-1" />
                    )}
                    Refresh
                  </button>
                </div>

                <div className="p-5">
                  {insightsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-t-indigo-600 border-indigo-600/30 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 text-sm">
                          Generating insights...
                        </p>
                      </div>
                    </div>
                  ) : insights ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-4 flex">
                        <div className="w-12 h-12 bg-blue-900/40 border border-blue-700/40 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1">
                            Nutrition Insight
                          </h3>
                          <p className="text-blue-100/90 text-sm">
                            {insights.nutrition}
                          </p>
                        </div>
                      </div>

                      <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-4 flex">
                        <div className="w-12 h-12 bg-purple-900/40 border border-purple-700/40 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <Activity className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1">
                            Fitness Insight
                          </h3>
                          <p className="text-purple-100/90 text-sm">
                            {insights.fitness}
                          </p>
                        </div>
                      </div>

                      <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-4 flex">
                        <div className="w-12 h-12 bg-amber-900/40 border border-amber-700/40 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <Target className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1">
                            Goals Insight
                          </h3>
                          <p className="text-amber-100/90 text-sm">
                            {insights.goals}
                          </p>
                        </div>
                      </div>

                      <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-xl p-4 flex">
                        <div className="w-12 h-12 bg-emerald-900/40 border border-emerald-700/40 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <ThumbsUp className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1">
                            Recommendation
                          </h3>
                          <p className="text-emerald-100/90 text-sm">
                            {insights.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-slate-400">
                        No insights available. Click refresh to generate
                        insights.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Goals and Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Goals */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-lg font-medium flex items-center">
                      <Target
                        className={`mr-2 text-${
                          user?.theme || "indigo"
                        }-400 h-5 w-5`}
                      />
                      Current Goals
                    </h2>
                  </div>

                  <div className="p-4">
                    {user.goals && user.goals.length > 0 ? (
                      <div className="space-y-4">
                        {user.goals.map((goal) => (
                          <div
                            key={goal.id}
                            className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-white">
                                {goal.name}
                              </h3>
                              <div
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  goal.type === "weight"
                                    ? "bg-blue-900/50 text-blue-300"
                                    : goal.type === "fitness"
                                    ? "bg-amber-900/50 text-amber-300"
                                    : "bg-emerald-900/50 text-emerald-300"
                                }`}
                              >
                                {goal.type.charAt(0).toUpperCase() +
                                  goal.type.slice(1)}
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 mt-1">
                              {goal.target}
                            </p>

                            <div className="mt-3">
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-slate-300">Progress</span>
                                <span>{goal.progress}%</span>
                              </div>
                              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`absolute top-0 left-0 h-full rounded-full ${
                                    goal.type === "weight"
                                      ? "bg-blue-500"
                                      : goal.type === "fitness"
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${goal.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
                              <span>Started {formatDate(goal.startDate)}</span>
                              <span>Target {formatDate(goal.endDate)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 px-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800/70 flex items-center justify-center mx-auto mb-3">
                          <Target className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-sm">
                          No goals set yet
                        </p>
                        <button
                          className={`mt-3 px-4 py-2 bg-${
                            user?.theme || "indigo"
                          }-600/40 hover:bg-${
                            user?.theme || "indigo"
                          }-600/60 rounded-lg text-white text-sm transition-colors`}
                        >
                          Add a Goal
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weight Progress */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-lg font-medium flex items-center">
                      <TrendingUp
                        className={`mr-2 text-${
                          user?.theme || "indigo"
                        }-400 h-5 w-5`}
                      />
                      Weight Progress
                    </h2>
                  </div>

                  <div className="p-4">
                    {user.healthData?.weight &&
                    user.healthData.weight.length > 0 ? (
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={user.healthData.weight}
                            margin={{ top: 10, right: 0, left: 0, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient
                                id="weightGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#6366f1"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#6366f1"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#334155"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                              axisLine={{ stroke: "#334155" }}
                              tickLine={{ stroke: "#334155" }}
                            />
                            <YAxis
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                              axisLine={{ stroke: "#334155" }}
                              tickLine={{ stroke: "#334155" }}
                              domain={[
                                (dataMin) => Math.floor(dataMin - 2),
                                (dataMax) => Math.ceil(dataMax + 2),
                              ]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                borderColor: "#475569",
                                borderRadius: "0.5rem",
                                color: "#f8fafc",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              name="Weight"
                              unit="kg"
                              stroke={`#${user?.theme || "indigo"}-500`}
                              fillOpacity={1}
                              fill="url(#weightGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-slate-400 text-sm">
                          No weight data available
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nutrition Distribution */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-lg font-medium flex items-center">
                      <PieChart
                        className={`mr-2 text-${
                          user?.theme || "indigo"
                        }-400 h-5 w-5`}
                      />
                      Macronutrient Balance
                    </h2>
                  </div>

                  <div className="p-4">
                    {user.healthData?.macros &&
                    user.healthData.macros.length > 0 ? (
                      <div className="h-60 flex flex-col items-center justify-center">
                        <div className="w-full h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <ReChartsPieChart>
                              <Pie
                                data={user.healthData.macros}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) =>
                                  `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                labelLine={false}
                              >
                                <Cell key="protein" fill="#3b82f6" />
                                <Cell key="carbs" fill="#10b981" />
                                <Cell key="fat" fill="#f59e0b" />
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  `${value}%`,
                                  "Percentage",
                                ]}
                                contentStyle={{
                                  backgroundColor: "#1e293b",
                                  borderColor: "#475569",
                                  borderRadius: "0.5rem",
                                  color: "#f8fafc",
                                }}
                              />
                            </ReChartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center space-x-4 mt-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                            <span className="text-xs text-slate-300">
                              Protein
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1"></div>
                            <span className="text-xs text-slate-300">
                              Carbs
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                            <span className="text-xs text-slate-300">Fat</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-slate-400 text-sm">
                          No nutrition data available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-1 bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-lg font-medium flex items-center">
                      <Activity
                        className={`mr-2 text-${
                          user?.theme || "indigo"
                        }-400 h-5 w-5`}
                      />
                      Recent Activity
                    </h2>
                  </div>

                  <div className="p-4">
                    {user.recentActivity && user.recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {user.recentActivity.map((activity) => {
                          // Activity icon based on type
                          let icon = (
                            <Activity className="h-5 w-5 text-slate-400" />
                          );
                          let bgColor = "bg-slate-800/60";

                          if (activity.type === "recipe") {
                            icon = (
                              <ChefHat className="h-5 w-5 text-amber-400" />
                            );
                            bgColor = "bg-amber-900/20";
                          } else if (activity.type === "workout") {
                            icon = (
                              <Dumbbell className="h-5 w-5 text-blue-400" />
                            );
                            bgColor = "bg-blue-900/20";
                          } else if (activity.type === "goal") {
                            icon = (
                              <Target className="h-5 w-5 text-green-400" />
                            );
                            bgColor = "bg-green-900/20";
                          } else if (activity.type === "nutrition") {
                            icon = (
                              <BookOpen className="h-5 w-5 text-purple-400" />
                            );
                            bgColor = "bg-purple-900/20";
                          } else if (activity.type === "weight") {
                            icon = (
                              <BarChart2 className="h-5 w-5 text-emerald-400" />
                            );
                            bgColor = "bg-emerald-900/20";
                          }

                          return (
                            <div key={activity.id} className="flex items-start">
                              <div
                                className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center mr-3 mt-0.5 flex-shrink-0`}
                              >
                                {icon}
                              </div>

                              <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm text-white">
                                      <span className="font-medium">
                                        {activity.action
                                          .charAt(0)
                                          .toUpperCase() +
                                          activity.action.slice(1)}
                                      </span>{" "}
                                      {activity.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {formatDate(activity.date)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-slate-400 text-sm">
                          No recent activity
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weekly Analytics */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-lg font-medium flex items-center">
                      <BarChart2
                        className={`mr-2 text-${
                          user?.theme || "indigo"
                        }-400 h-5 w-5`}
                      />
                      Weekly Analytics
                    </h2>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-1">
                          Avg. Calories
                        </div>
                        <div className="text-xl font-bold text-white">
                          {calculateDailyAverage("caloriesConsumed")}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Daily consumption
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-1">
                          Avg. Calories Burned
                        </div>
                        <div className="text-xl font-bold text-white">
                          {calculateDailyAverage("caloriesBurned")}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Daily expenditure
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-1">
                          Avg. Workout Time
                        </div>
                        <div className="text-xl font-bold text-white">
                          {calculateDailyAverage("workoutMinutes")}{" "}
                          <span className="text-sm font-normal">min</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Daily activity
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-1">
                          Avg. Sleep
                        </div>
                        <div className="text-xl font-bold text-white">
                          {calculateDailyAverage("sleepHours")}{" "}
                          <span className="text-sm font-normal">hrs</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Daily rest
                        </div>
                      </div>
                    </div>

                    {/* Weekly calorie chart */}
                    {user.healthData?.caloriesConsumed &&
                      user.healthData?.caloriesBurned && (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={user.healthData.caloriesConsumed.map(
                                (item, index) => ({
                                  date: item.date,
                                  consumed: item.value,
                                  burned:
                                    user.healthData.caloriesBurned[index]
                                      ?.value || 0,
                                  net:
                                    item.value -
                                    (user.healthData.caloriesBurned[index]
                                      ?.value || 0),
                                })
                              )}
                              margin={{ top: 10, right: 0, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#334155"
                              />
                              <XAxis
                                dataKey="date"
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
                                axisLine={{ stroke: "#334155" }}
                                tickLine={{ stroke: "#334155" }}
                              />
                              <YAxis
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
                                axisLine={{ stroke: "#334155" }}
                                tickLine={{ stroke: "#334155" }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1e293b",
                                  borderColor: "#475569",
                                  borderRadius: "0.5rem",
                                  color: "#f8fafc",
                                }}
                              />
                              <Bar
                                dataKey="consumed"
                                name="Calories Consumed"
                                fill="#6366f1"
                              />
                              <Bar
                                dataKey="burned"
                                name="Calories Burned"
                                fill="#ef4444"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                    <div className="mt-4 flex justify-between items-center text-sm">
                      <div className="text-slate-400">
                        Most active time:{" "}
                        <span className="text-white">
                          {getMostActiveTime()}
                        </span>
                      </div>
                      <button className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center">
                        <ChevronRight className="h-4 w-4 ml-0.5" />
                        <span className="text-xs">See more analytics</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* User achievements preview */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                  <h2 className="text-lg font-medium flex items-center">
                    <Trophy
                      className={`mr-2 text-${
                        user?.theme || "indigo"
                      }-400 h-5 w-5`}
                    />
                    Achievements
                  </h2>

                  <button
                    onClick={() => setActiveTab("achievements")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center"
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-0.5" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {unlockedAchievements.slice(0, 5).map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        isUnlocked={true}
                      />
                    ))}

                    {unlockedAchievements.length === 0 && (
                      <div className="col-span-full text-center py-6">
                        <p className="text-slate-400 text-sm">
                          No achievements unlocked yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social connections */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50">
                  <h2 className="text-lg font-medium flex items-center">
                    <Users
                      className={`mr-2 text-${
                        user?.theme || "indigo"
                      }-400 h-5 w-5`}
                    />
                    Social Stats
                  </h2>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-900/30 border border-indigo-600/30 flex items-center justify-center mr-4">
                        <Users className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {user.socialConnections?.friends || 0}
                        </div>
                        <div className="text-sm text-slate-400">Friends</div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-purple-900/30 border border-purple-600/30 flex items-center justify-center mr-4">
                        <ChefHat className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {user.socialConnections?.recipes_shared || 0}
                        </div>
                        <div className="text-sm text-slate-400">
                          Recipes Shared
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-600/30 flex items-center justify-center mr-4">
                        <Activity className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {user.socialConnections?.workouts_shared || 0}
                        </div>
                        <div className="text-sm text-slate-400">
                          Workouts Shared
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Achievements Tab */}
          {activeTab === "achievements" && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-transparent bg-clip-text mb-2">
                    Achievements
                  </h2>
                  <p className="text-slate-400">
                    Track your progress and unlock rewards as you reach your
                    health and fitness goals
                  </p>
                </div>

                <div className="bg-slate-800/70 rounded-lg p-2 border border-slate-700/50">
                  <div className="flex items-center">
                    <div className="mr-3">
                      <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-transparent bg-clip-text">
                        {unlockedAchievements.length}/{userAchievements.length}
                      </div>
                      <div className="text-xs text-slate-400">Unlocked</div>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center">
                      <div className="relative">
                        <svg className="w-9 h-9">
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="#1f2937"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="url(#gold-gradient)"
                            strokeWidth="3"
                            strokeDasharray={`${
                              (unlockedAchievements.length /
                                userAchievements.length) *
                              100
                            } 100`}
                            strokeDashoffset="25"
                            transform="rotate(-90 18 18)"
                          />
                          <defs>
                            <linearGradient
                              id="gold-gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#fbbf24" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <Trophy className="h-4 w-4 text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unlocked Achievements */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <CheckCircle className="mr-2 text-emerald-500 h-5 w-5" />
                    Unlocked Achievements
                  </h2>
                </div>

                <div className="p-5">
                  {unlockedAchievements.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {unlockedAchievements.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          isUnlocked={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        <Trophy className="h-8 w-8 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        No achievements yet
                      </h3>
                      <p className="text-slate-400 max-w-md mx-auto">
                        Start tracking your health and fitness journey to unlock
                        achievements
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Locked Achievements */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <Lock className="mr-2 text-slate-400 h-5 w-5" />
                    Achievements to Unlock
                  </h2>
                </div>

                <div className="p-5">
                  {lockedAchievements.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {lockedAchievements.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          isUnlocked={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-3">
                        <Trophy className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        All achievements unlocked!
                      </h3>
                      <p className="text-slate-400">
                        Congratulations! You've unlocked all available
                        achievements.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 text-transparent bg-clip-text mb-6">
                Activity History
              </h2>

              {/* Recent Activity */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center">
                    <Activity className="mr-2 text-blue-400 h-5 w-5" />
                    Recent Activities
                  </h2>

                  <div className="flex items-center">
                    <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors">
                      <Filter size={16} />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-700/30">
                  {user.recentActivity && user.recentActivity.length > 0 ? (
                    user.recentActivity.map((activity) => {
                      // Activity icon and color based on type
                      let icon = (
                        <Activity className="h-6 w-6 text-slate-400" />
                      );
                      let bgColor = "bg-slate-800/60";
                      let typeLabel = "Activity";

                      if (activity.type === "recipe") {
                        icon = <ChefHat className="h-6 w-6 text-amber-400" />;
                        bgColor = "bg-amber-900/20";
                        typeLabel = "Recipe";
                      } else if (activity.type === "workout") {
                        icon = <Dumbbell className="h-6 w-6 text-blue-400" />;
                        bgColor = "bg-blue-900/20";
                        typeLabel = "Workout";
                      } else if (activity.type === "goal") {
                        icon = <Target className="h-6 w-6 text-green-400" />;
                        bgColor = "bg-green-900/20";
                        typeLabel = "Goal";
                      } else if (activity.type === "nutrition") {
                        icon = <BookOpen className="h-6 w-6 text-purple-400" />;
                        bgColor = "bg-purple-900/20";
                        typeLabel = "Nutrition";
                      } else if (activity.type === "weight") {
                        icon = (
                          <BarChart2 className="h-6 w-6 text-emerald-400" />
                        );
                        bgColor = "bg-emerald-900/20";
                        typeLabel = "Weight";
                      }

                      return (
                        <div
                          key={activity.id}
                          className="p-4 hover:bg-slate-800/20 transition-colors"
                        >
                          <div className="flex items-start">
                            <div
                              className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center mr-4 flex-shrink-0`}
                            >
                              {icon}
                            </div>

                            <div className="flex-grow">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-white font-medium">
                                    <span className="capitalize">
                                      {activity.action}
                                    </span>{" "}
                                    {activity.name}
                                  </h3>
                                  <p className="text-sm text-slate-400">
                                    {formatDate(activity.date)}
                                  </p>
                                </div>

                                <div
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    activity.type === "recipe"
                                      ? "bg-amber-900/30 text-amber-300 border border-amber-700/30"
                                      : activity.type === "workout"
                                      ? "bg-blue-900/30 text-blue-300 border border-blue-700/30"
                                      : activity.type === "goal"
                                      ? "bg-green-900/30 text-green-300 border border-green-700/30"
                                      : activity.type === "nutrition"
                                      ? "bg-purple-900/30 text-purple-300 border border-purple-700/30"
                                      : activity.type === "weight"
                                      ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/30"
                                      : "bg-slate-800/50 text-slate-300 border border-slate-700/30"
                                  }`}
                                >
                                  {typeLabel}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-slate-400">No activity found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly Activity */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-base font-bold flex items-center">
                      <Calendar className="mr-2 text-blue-400 h-5 w-5" />
                      Weekly Activity
                    </h2>
                  </div>

                  <div className="p-4">
                    {user.healthData?.workoutMinutes &&
                    user.healthData.workoutMinutes.length > 0 ? (
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={user.healthData.workoutMinutes}
                            margin={{ top: 10, right: 0, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#334155"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                              axisLine={{ stroke: "#334155" }}
                              tickLine={{ stroke: "#334155" }}
                            />
                            <YAxis
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                              axisLine={{ stroke: "#334155" }}
                              tickLine={{ stroke: "#334155" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                borderColor: "#475569",
                                borderRadius: "0.5rem",
                                color: "#f8fafc",
                              }}
                              formatter={(value) => [
                                `${value} min`,
                                "Workout Time",
                              ]}
                            />
                            <Bar
                              dataKey="value"
                              fill={`#${user?.theme || "indigo"}-500`}
                              name="Workout Minutes"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-60">
                        <p className="text-slate-400">
                          No activity data available
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sleep Quality */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-base font-bold flex items-center">
                      <Clock className="mr-2 text-blue-400 h-5 w-5" />
                      Sleep Tracking
                    </h2>
                  </div>

                  <div className="p-4">
                    {user.healthData?.sleepHours &&
                    user.healthData.sleepHours.length > 0 ? (
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={user.healthData.sleepHours}
                            margin={{ top: 10, right: 0, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#334155"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                              axisLine={{ stroke: "#334155" }}
                              tickLine={{ stroke: "#334155" }}
                            />
                            <YAxis
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                              axisLine={{ stroke: "#334155" }}
                              tickLine={{ stroke: "#334155" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                borderColor: "#475569",
                                borderRadius: "0.5rem",
                                color: "#f8fafc",
                              }}
                              formatter={(value) => [
                                `${value} hours`,
                                "Sleep Duration",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={`#${user?.theme || "indigo"}-500`}
                              strokeWidth={2}
                              dot={{
                                stroke: `#${user?.theme || "indigo"}-500`,
                                fill: `#${user?.theme || "indigo"}-500`,
                                r: 4,
                              }}
                              activeDot={{
                                stroke: `#${user?.theme || "indigo"}-500`,
                                fill: `#${user?.theme || "indigo"}-500`,
                                r: 6,
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-60">
                        <p className="text-slate-400">
                          No sleep data available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fitness Radar Chart */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <BarChart2 className="mr-2 text-blue-400 h-5 w-5" />
                    Fitness Profile
                  </h2>
                </div>

                <div className="p-4">
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        outerRadius={150}
                        width={500}
                        height={500}
                        data={[
                          { category: "Cardio", value: 80 },
                          { category: "Strength", value: 65 },
                          { category: "Flexibility", value: 45 },
                          { category: "Endurance", value: 70 },
                          { category: "Balance", value: 60 },
                        ]}
                      >
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="category" stroke="#94a3b8" />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          stroke="#94a3b8"
                        />
                        <Radar
                          name="Fitness Level"
                          dataKey="value"
                          stroke={`#${user?.theme || "indigo"}-500`}
                          fill={`#${user?.theme || "indigo"}-500`}
                          fillOpacity={0.5}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            borderColor: "#475569",
                            borderRadius: "0.5rem",
                            color: "#f8fafc",
                          }}
                          formatter={(value) => [`${value}%`, "Fitness Level"]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-rose-500 text-transparent bg-clip-text mb-6">
                Your Favorites
              </h2>

              {/* Saved Recipes */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <ChefHat className="mr-2 text-amber-400 h-5 w-5" />
                    Saved Recipes
                  </h2>
                </div>

                <div className="p-5">
                  {user.savedRecipes && user.savedRecipes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {user.savedRecipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="group relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-amber-500/30 transition-all"
                        >
                          <div className="h-40 bg-slate-700/50 relative">
                            {/* Would use real images in production */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/30 to-red-600/30 flex items-center justify-center">
                              <ChefHat className="h-12 w-12 text-white/30" />
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/80 to-transparent">
                              <div
                                className={`px-2 py-0.5 rounded text-xs font-medium inline-block ${
                                  recipe.type === "breakfast"
                                    ? "bg-amber-900/60 text-amber-300 border border-amber-700/40"
                                    : recipe.type === "lunch"
                                    ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40"
                                    : recipe.type === "dinner"
                                    ? "bg-blue-900/60 text-blue-300 border border-blue-700/40"
                                    : "bg-purple-900/60 text-purple-300 border border-purple-700/40"
                                }`}
                              >
                                {recipe.type.charAt(0).toUpperCase() +
                                  recipe.type.slice(1)}
                              </div>
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="text-white font-medium mb-1 line-clamp-1">
                              {recipe.name}
                            </h3>
                            <p className="text-xs text-slate-400">
                              Saved on {formatDate(recipe.saved)}
                            </p>

                            <div className="flex justify-between items-center mt-4">
                              <button className="text-xs px-2 py-1.5 bg-amber-900/30 text-amber-300 hover:bg-amber-900/50 transition-colors rounded flex items-center">
                                <ChefHat className="mr-1 h-3 w-3" />
                                View Recipe
                              </button>

                              <button className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-full hover:bg-rose-900/30">
                                <Heart className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        <ChefHat className="h-8 w-8 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        No saved recipes
                      </h3>
                      <p className="text-slate-400 max-w-md mx-auto mb-6">
                        Save your favorite recipes to access them quickly
                      </p>
                      <button
                        onClick={() => router.push("/recipe")}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:opacity-90 rounded-lg text-white transition-colors"
                      >
                        Explore Recipes
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Favorite Workouts */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <Dumbbell className="mr-2 text-blue-400 h-5 w-5" />
                    Favorite Workouts
                  </h2>
                </div>

                <div className="p-5">
                  {user.favoriteWorkouts && user.favoriteWorkouts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.favoriteWorkouts.map((workout) => (
                        <div
                          key={workout.id}
                          className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-blue-500/30 transition-all"
                        >
                          <div className="p-4 border-b border-slate-700/30 flex justify-between items-center">
                            <div>
                              <h3 className="text-white font-medium">
                                {workout.name}
                              </h3>
                              <div className="flex items-center text-sm text-slate-400 mt-1">
                                <Clock className="mr-1 h-3 w-3" />
                                {workout.duration} min
                              </div>
                            </div>

                            <div
                              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                workout.type === "cardio"
                                  ? "bg-red-900/30 text-red-300 border border-red-700/30"
                                  : workout.type === "strength"
                                  ? "bg-blue-900/30 text-blue-300 border border-blue-700/30"
                                  : "bg-purple-900/30 text-purple-300 border border-purple-700/30"
                              }`}
                            >
                              {workout.type.charAt(0).toUpperCase() +
                                workout.type.slice(1)}
                            </div>
                          </div>

                          <div className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-slate-400">
                                Last performed:{" "}
                                {formatDate(workout.lastPerformed)}
                              </div>

                              <button className="text-xs px-3 py-1.5 bg-blue-600/40 hover:bg-blue-600/60 text-white transition-colors rounded-full flex items-center">
                                <Play className="mr-1 h-3 w-3" />
                                Start Workout
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        <Activity className="h-8 w-8 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        No favorite workouts
                      </h3>
                      <p className="text-slate-400 max-w-md mx-auto mb-6">
                        Save your favorite workouts to access them quickly
                      </p>
                      <button
                        onClick={() => router.push("/fitness")}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-90 rounded-lg text-white transition-colors"
                      >
                        Explore Workouts
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recently Viewed */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <Clock className="mr-2 text-purple-400 h-5 w-5" />
                    Recently Viewed
                  </h2>
                </div>

                <div className="p-5 space-y-3">
                  {/* Simulated recent views - would be dynamic in real app */}
                  <div className="flex items-center bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-purple-500/30 transition-all">
                    <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                      <ChefHat className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-white text-sm">
                        Protein-Packed Breakfast Bowl
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs bg-amber-900/30 text-amber-300 px-2 py-0.5 rounded">
                          Recipe
                        </span>
                        <span className="text-xs text-slate-400">
                          Viewed 2 hours ago
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-purple-500/30 transition-all">
                    <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                      <Activity className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-white text-sm">
                        30-Minute HIIT Workout
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded">
                          Workout
                        </span>
                        <span className="text-xs text-slate-400">
                          Viewed yesterday
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-purple-500/30 transition-all">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                      <BarChart2 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-white text-sm">
                        Monthly Nutrition Report
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs bg-emerald-900/30 text-emerald-300 px-2 py-0.5 rounded">
                          Report
                        </span>
                        <span className="text-xs text-slate-400">
                          Viewed 3 days ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 text-transparent bg-clip-text mb-6">
                Account Settings
              </h2>

              {/* Account Details */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <User className="mr-2 text-slate-400 h-5 w-5" />
                    Account Details
                  </h2>
                </div>

                <div className="p-5 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editableUser?.name || ""}
                        onChange={(e) =>
                          setEditableUser((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          @
                        </span>
                        <input
                          type="text"
                          value={editableUser?.username || ""}
                          onChange={(e) =>
                            setEditableUser((prev) => ({
                              ...prev,
                              username: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-8 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editableUser?.email || ""}
                        onChange={(e) =>
                          setEditableUser((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editableUser?.location || ""}
                        onChange={(e) =>
                          setEditableUser((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={editableUser?.bio || ""}
                      onChange={(e) =>
                        setEditableUser((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className={`px-5 py-2 bg-gradient-to-r ${getThemeGradient(
                        "bg",
                        user?.theme
                      )} rounded-lg text-white font-medium transition-all flex items-center ${
                        saving ? "opacity-70" : "hover:opacity-90"
                      }`}
                    >
                      {saving ? (
                        <>
                          <Loader size={16} className="mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <Paintbrush className="mr-2 text-slate-400 h-5 w-5" />
                    Theme Settings
                  </h2>
                </div>

                <div className="p-5">
                  <h3 className="text-base text-slate-300 mb-4">
                    Choose Your Theme
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                    {Object.entries(THEME_COLORS).map(([key, value]) => (
                      <div key={key}>
                        <label className="cursor-pointer flex flex-col items-center">
                          <div className="relative">
                            <div
                              className={`w-20 h-10 rounded-lg bg-gradient-to-r from-${value.from} to-${value.to} mb-2`}
                            ></div>

                            <div
                              className={`absolute top-1 right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center ${
                                editableUser?.theme === key
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              <Check className={`h-3 w-3 text-${value.from}`} />
                            </div>
                          </div>

                          <div className="mt-1">
                            <input
                              type="radio"
                              name="theme"
                              value={key}
                              checked={editableUser?.theme === key}
                              onChange={() => handleThemeChange(key)}
                              className="sr-only"
                            />
                            <span className="text-sm capitalize text-slate-300">
                              {key}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className={`px-4 py-2 bg-gradient-to-r ${getThemeGradient(
                        "bg",
                        editableUser?.theme
                      )} rounded-lg text-sm text-white font-medium transition-all flex items-center ${
                        saving ? "opacity-70" : "hover:opacity-90"
                      }`}
                    >
                      {saving ? (
                        <>
                          <Loader size={14} className="mr-1.5 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Save size={14} className="mr-1.5" />
                          Apply Theme
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <Bell className="mr-2 text-slate-400 h-5 w-5" />
                    Notification Settings
                  </h2>
                </div>

                <div className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-slate-400">
                          Receive alerts and updates via email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            editableUser?.settings?.emailNotifications || false
                          }
                          onChange={(e) =>
                            setEditableUser((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                emailNotifications: e.target.checked,
                              },
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">
                          Push Notifications
                        </h3>
                        <p className="text-sm text-slate-400">
                          Get push notifications in your browser or app
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            editableUser?.settings?.pushNotifications || false
                          }
                          onChange={(e) =>
                            setEditableUser((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                pushNotifications: e.target.checked,
                              },
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">
                          Weekly Reports
                        </h3>
                        <p className="text-sm text-slate-400">
                          Receive weekly summary of your activity
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            editableUser?.settings?.weeklyReports || false
                          }
                          onChange={(e) =>
                            setEditableUser((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                weeklyReports: e.target.checked,
                              },
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* App Settings */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <Settings className="mr-2 text-slate-400 h-5 w-5" />
                    App Settings
                  </h2>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Dark Mode</h3>
                      <p className="text-sm text-slate-400">
                        Toggle dark/light theme
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editableUser?.settings?.darkMode || false}
                        onChange={(e) =>
                          setEditableUser((prev) => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              darkMode: e.target.checked,
                            },
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-2">Language</h3>
                    <select
                      value={editableUser?.settings?.language || "english"}
                      onChange={(e) =>
                        setEditableUser((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            language: e.target.value,
                          },
                        }))
                      }
                      className="w-full md:w-auto bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="english">English</option>
                      <option value="spanish">Spanish</option>
                      <option value="french">French</option>
                      <option value="german">German</option>
                      <option value="japanese">Japanese</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-2">Unit System</h3>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="unitSystem"
                          value="metric"
                          checked={
                            editableUser?.settings?.unitSystem === "metric"
                          }
                          onChange={() =>
                            setEditableUser((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                unitSystem: "metric",
                              },
                            }))
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 bg-slate-800"
                        />
                        <span className="ml-2 text-slate-300">
                          Metric (kg, cm)
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="unitSystem"
                          value="imperial"
                          checked={
                            editableUser?.settings?.unitSystem === "imperial"
                          }
                          onChange={() =>
                            setEditableUser((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                unitSystem: "imperial",
                              },
                            }))
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 bg-slate-800"
                        />
                        <span className="ml-2 text-slate-300">
                          Imperial (lb, in)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-2">
                      Privacy Mode
                    </h3>
                    <select
                      value={editableUser?.settings?.privacyMode || "public"}
                      onChange={(e) =>
                        setEditableUser((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            privacyMode: e.target.value,
                          },
                        }))
                      }
                      className="w-full md:w-auto bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="public">
                        Public (Everyone can see your profile)
                      </option>
                      <option value="friends">
                        Friends Only (Only friends can see details)
                      </option>
                      <option value="private">
                        Private (Only you can see your profile)
                      </option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className={`px-5 py-2 bg-gradient-to-r ${getThemeGradient(
                        "bg",
                        user?.theme
                      )} rounded-lg text-white font-medium transition-all flex items-center ${
                        saving ? "opacity-70" : "hover:opacity-90"
                      }`}
                    >
                      {saving ? (
                        <>
                          <Loader size={16} className="mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Premium Subscription */}
              <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-md rounded-xl border border-amber-700/30 overflow-hidden">
                <div className="p-5 border-b border-amber-700/30">
                  <h2 className="text-lg font-bold flex items-center">
                    <Star className="mr-2 text-amber-400 h-5 w-5" />
                    Premium Subscription
                  </h2>
                </div>

                <div className="p-5">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-xl font-bold text-white mr-2">
                          AnnaData {user?.subscriptionTier || "Free"}
                        </h3>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user?.subscriptionTier === "premium"
                              ? "bg-gradient-to-r from-amber-600 to-yellow-500 text-white"
                              : user?.subscriptionTier === "pro"
                              ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {user?.subscriptionTier === "premium"
                            ? "Premium"
                            : user?.subscriptionTier === "pro"
                            ? "Pro"
                            : "Free Plan"}
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 mt-2">
                        {user?.subscriptionTier === "premium" ||
                        user?.subscriptionTier === "pro" ? (
                          <>
                            Your subscription is active until{" "}
                            {formatDate(user?.subscriptionExpiry)}
                          </>
                        ) : (
                          <>
                            Upgrade to Premium for advanced features and
                            insights!
                          </>
                        )}
                      </p>
                    </div>

                    {!user?.subscriptionTier ||
                    user?.subscriptionTier === "free" ? (
                      <button className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:opacity-90 rounded-lg text-white font-medium transition-colors flex items-center">
                        <Star className="mr-2 h-5 w-5" />
                        Upgrade to Premium
                      </button>
                    ) : (
                      <button className="px-5 py-2.5 border border-amber-600/50 bg-amber-900/20 hover:bg-amber-900/40 rounded-lg text-amber-300 font-medium transition-colors">
                        Manage Subscription
                      </button>
                    )}
                  </div>

                  {(!user?.subscriptionTier ||
                    user?.subscriptionTier === "free") && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-black/30 backdrop-blur-sm border border-amber-700/30 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <Check className="h-5 w-5 text-amber-500 mr-2" />
                          <h4 className="text-amber-300 font-medium">
                            AI-Powered Insights
                          </h4>
                        </div>
                        <p className="text-sm text-slate-400">
                          Get personalized recommendations and analysis based on
                          your data
                        </p>
                      </div>

                      <div className="bg-black/30 backdrop-blur-sm border border-amber-700/30 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <Check className="h-5 w-5 text-amber-500 mr-2" />
                          <h4 className="text-amber-300 font-medium">
                            Advanced Analytics
                          </h4>
                        </div>
                        <p className="text-sm text-slate-400">
                          Detailed charts and progress tracking for all your
                          health metrics
                        </p>
                      </div>

                      <div className="bg-black/30 backdrop-blur-sm border border-amber-700/30 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <Check className="h-5 w-5 text-amber-500 mr-2" />
                          <h4 className="text-amber-300 font-medium">
                            No Advertisements
                          </h4>
                        </div>
                        <p className="text-sm text-slate-400">
                          Enjoy an ad-free experience throughout the entire
                          application
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <Shield className="mr-2 text-slate-400 h-5 w-5" />
                    Account Security & Actions
                  </h2>
                </div>

                <div className="p-5">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-medium mb-2">Password</h3>
                      <button className="px-4 py-2.5 bg-slate-800/70 hover:bg-slate-800 rounded-lg text-white transition-colors flex items-center text-sm">
                        <Lock className="mr-2 h-4 w-4" />
                        Change Password
                      </button>
                    </div>

                    <div>
                      <h3 className="text-white font-medium mb-2">
                        Account Data
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <button className="px-4 py-2.5 bg-slate-800/70 hover:bg-slate-800 rounded-lg text-white transition-colors flex items-center text-sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download My Data
                        </button>

                        <button className="px-4 py-2.5 bg-slate-800/70 hover:bg-slate-800 rounded-lg text-white transition-colors flex items-center text-sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Import Data
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-700/30">
                      <h3 className="text-red-400 font-medium mb-2">
                        Danger Zone
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2.5 bg-red-900/30 border border-red-700/30 hover:bg-red-900/50 rounded-lg text-red-300 transition-colors flex items-center text-sm"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Account
                        </button>

                        <button className="px-4 py-2.5 bg-amber-900/30 border border-amber-700/30 hover:bg-amber-900/50 rounded-lg text-amber-300 transition-colors flex items-center text-sm">
                          <LogOut className="mr-2 h-4 w-4" />
                          Log Out Everywhere
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support and Help */}
              <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center">
                    <HelpCircle className="mr-2 text-slate-400 h-5 w-5" />
                    Help & Support
                  </h2>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                      href="#"
                      className="bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-lg p-4 transition-colors flex items-start"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                        <Book className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">
                          Documentation
                        </h3>
                        <p className="text-sm text-slate-400">
                          Read the user guides and tutorials
                        </p>
                      </div>
                    </a>

                    <a
                      href="#"
                      className="bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-lg p-4 transition-colors flex items-start"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                        <MessageCircle className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">
                          Contact Support
                        </h3>
                        <p className="text-sm text-slate-400">
                          Get help from our support team
                        </p>
                      </div>
                    </a>

                    <a
                      href="#"
                      className="bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-lg p-4 transition-colors flex items-start"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                        <Coffee className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">
                          Community
                        </h3>
                        <p className="text-sm text-slate-400">
                          Join our community forum
                        </p>
                      </div>
                    </a>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <div className="text-center max-w-md">
                      <p className="text-sm text-slate-400">
                        AnnaData Version 2.4.0 • Last Login:{" "}
                        {formatDate(user?.lastLogin || "2025-04-19T07:30:00Z")}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        © 2025 AnnaData •{" "}
                        <a
                          href="#"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Terms of Service
                        </a>{" "}
                        •{" "}
                        <a
                          href="#"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Privacy Policy
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>

      {/* Profile picture upload modal */}
      {showProfilePictureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <ProfilePictureUploader
            currentImage={user?.profileImage}
            onUpdate={handleUpdateProfilePicture}
            onClose={() => setShowProfilePictureModal(false)}
          />
        </div>
      )}

      {/* Delete account confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-red-700/30 shadow-2xl">
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Delete Your Account?
              </h2>
              <p className="text-slate-300">
                This action cannot be undone. All your data will be permanently
                deleted.
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-300">
                <strong>Warning:</strong> You will lose all your recipes,
                workouts, achievement progress, and profile data.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleDeleteAccount}
                className="py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Yes, Delete My Account
              </button>

              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current date and user */}
      <div className="fixed bottom-2 right-2 text-xs text-slate-600">
        Last activity: 2025-04-19 08:25:55 (UTC) • User: NiladriHazra
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
