"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Activity,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  Heart,
  Home as HomeIcon,
  LineChart,
  MessageCircle,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  Trash2,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  X,
  Filter,
  BarChart2,
  Zap,
  Target,
  Dumbbell,
  Award,
  Droplet,
  BookOpen,
  ThumbsUp,
  AlertTriangle,
  Info,
  CheckCircle,
  Watch,
  Camera,
  Pause,
  Play,
  ChefHat,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart as ReChartsLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ""
);

// Custom workout history sample data
const WORKOUT_TYPES = [
  { id: "cardio", name: "Cardio", icon: <Activity size={18} /> },
  { id: "strength", name: "Strength", icon: <Dumbbell size={18} /> },
  { id: "yoga", name: "Yoga", icon: <Users size={18} /> },
  { id: "hiit", name: "HIIT", icon: <Zap size={18} /> },
  { id: "stretching", name: "Stretching", icon: <UserPlus size={18} /> },
  { id: "sports", name: "Sports", icon: <Target size={18} /> },
];

// Generate today's date in YYYY-MM-DD format
const generateTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

// Custom hook for metrics
const useMetrics = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Load from localStorage if available
    try {
      const savedMetrics = localStorage.getItem("fitnessMetrics");
      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      } else {
        // Initialize with default values
        const defaultMetrics = {
          bodyStats: {
            weight: { value: 70, unit: "kg", history: [] },
            height: { value: 175, unit: "cm" },
            bodyFat: { value: 20, unit: "%", history: [] },
            bmi: { value: null, history: [] },
            waist: { value: 81, unit: "cm", history: [] },
            chest: { value: 95, unit: "cm", history: [] },
            arms: { value: 33, unit: "cm", history: [] },
            thighs: { value: 55, unit: "cm", history: [] },
          },
          fitnessLevels: {
            cardio: { value: 65, unit: "%" },
            strength: { value: 70, unit: "%" },
            flexibility: { value: 60, unit: "%" },
            endurance: { value: 75, unit: "%" },
            balance: { value: 50, unit: "%" },
          },
          goals: {
            daily: {
              steps: 10000,
              water: 8,
              activeMinutes: 60,
              caloriesBurned: 500,
            },
            weekly: { workouts: 5, activeMinutes: 300, distance: 20 },
            custom: [
              {
                id: 1,
                name: "Lose weight",
                target: "2 kg in 4 weeks",
                progress: 25,
                achieved: false,
              },
              {
                id: 2,
                name: "Run 5K",
                target: "Under 30 minutes",
                progress: 60,
                achieved: false,
              },
            ],
          },
          progress: {
            steps: {
              today: 7430,
              yesterday: 8912,
              thisWeek: 42156,
              goal: 10000,
            },
            water: { today: 5, yesterday: 7, thisWeek: 38, goal: 8 },
            activeMinutes: {
              today: 45,
              yesterday: 62,
              thisWeek: 285,
              goal: 60,
            },
            caloriesBurned: {
              today: 320,
              yesterday: 450,
              thisWeek: 2300,
              goal: 500,
            },
            distance: { today: 3.2, yesterday: 4.5, thisWeek: 18.6, goal: 5 },
          },
        };

        // Calculate BMI
        defaultMetrics.bodyStats.bmi.value = (
          defaultMetrics.bodyStats.weight.value /
          (defaultMetrics.bodyStats.height.value / 100) ** 2
        ).toFixed(1);

        setMetrics(defaultMetrics);
        localStorage.setItem("fitnessMetrics", JSON.stringify(defaultMetrics));
      }
    } catch (error) {
      console.error("Error loading fitness metrics:", error);
    }
  }, []);

  const updateMetric = useCallback((category, metricName, value, date) => {
    setMetrics((prev) => {
      if (!prev) return prev;

      const newMetrics = { ...prev };

      // Update current value
      if (category === "bodyStats") {
        newMetrics[category][metricName].value = value;

        // Add to history if date provided
        if (date) {
          const historyEntry = { date, value };

          // Check if history exists, if not create it
          if (!newMetrics[category][metricName].history) {
            newMetrics[category][metricName].history = [];
          }

          // Add to history (avoiding duplicates by date)
          const existingEntryIndex = newMetrics[category][
            metricName
          ].history.findIndex((entry) => entry.date === date);

          if (existingEntryIndex >= 0) {
            newMetrics[category][metricName].history[existingEntryIndex] =
              historyEntry;
          } else {
            newMetrics[category][metricName].history.push(historyEntry);
          }

          // Sort history by date
          newMetrics[category][metricName].history.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
        }

        // Recalculate BMI if weight or height changes
        if (metricName === "weight" || metricName === "height") {
          const weightInKg = newMetrics.bodyStats.weight.value;
          const heightInM = newMetrics.bodyStats.height.value / 100;
          const bmi = (weightInKg / heightInM ** 2).toFixed(1);

          newMetrics.bodyStats.bmi.value = bmi;

          // Add BMI to history if date provided
          if (date) {
            const bmiHistoryEntry = { date, value: bmi };

            // Check if history exists, if not create it
            if (!newMetrics.bodyStats.bmi.history) {
              newMetrics.bodyStats.bmi.history = [];
            }

            // Add to history (avoiding duplicates by date)
            const existingBmiIndex = newMetrics.bodyStats.bmi.history.findIndex(
              (entry) => entry.date === date
            );

            if (existingBmiIndex >= 0) {
              newMetrics.bodyStats.bmi.history[existingBmiIndex] =
                bmiHistoryEntry;
            } else {
              newMetrics.bodyStats.bmi.history.push(bmiHistoryEntry);
            }

            // Sort history by date
            newMetrics.bodyStats.bmi.history.sort(
              (a, b) => new Date(a.date) - new Date(b.date)
            );
          }
        }
      } else if (category === "fitnessLevels") {
        newMetrics[category][metricName].value = value;
      } else if (category === "goals") {
        if (metricName === "custom") {
          // For custom goals, value is the entire goal object
          const goalIndex = newMetrics[category][metricName].findIndex(
            (goal) => goal.id === value.id
          );

          if (goalIndex >= 0) {
            newMetrics[category][metricName][goalIndex] = value;
          } else {
            newMetrics[category][metricName].push({
              ...value,
              id:
                newMetrics[category][metricName].length > 0
                  ? Math.max(
                      ...newMetrics[category][metricName].map((g) => g.id)
                    ) + 1
                  : 1,
            });
          }
        } else {
          // For daily/weekly goals
          newMetrics[category][metricName] = {
            ...newMetrics[category][metricName],
            ...value,
          };
        }
      } else if (category === "progress") {
        newMetrics[category][metricName] = {
          ...newMetrics[category][metricName],
          ...value,
        };
      }

      // Save to localStorage
      localStorage.setItem("fitnessMetrics", JSON.stringify(newMetrics));

      return newMetrics;
    });
  }, []);

  const deleteCustomGoal = useCallback((goalId) => {
    setMetrics((prev) => {
      if (!prev) return prev;

      const newMetrics = { ...prev };
      newMetrics.goals.custom = newMetrics.goals.custom.filter(
        (goal) => goal.id !== goalId
      );

      // Save to localStorage
      localStorage.setItem("fitnessMetrics", JSON.stringify(newMetrics));

      return newMetrics;
    });
  }, []);

  return { metrics, updateMetric, deleteCustomGoal };
};

// Custom hook for workouts
const useWorkouts = () => {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    // Load from localStorage if available
    try {
      const savedWorkouts = localStorage.getItem("fitnessWorkouts");
      if (savedWorkouts) {
        setWorkouts(JSON.parse(savedWorkouts));
      } else {
        // Initialize with sample data
        const today = generateTodayDate();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayFormatted = yesterday.toISOString().slice(0, 10);

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoFormatted = twoDaysAgo.toISOString().slice(0, 10);

        const sampleWorkouts = [
          {
            id: 1,
            type: "cardio",
            name: "Morning Run",
            date: twoDaysAgoFormatted,
            duration: 35,
            distance: 4.2,
            caloriesBurned: 320,
            heartRate: { avg: 145, max: 175 },
            notes: "Felt good, kept a steady pace",
            completed: true,
          },
          {
            id: 2,
            type: "strength",
            name: "Upper Body",
            date: yesterdayFormatted,
            duration: 55,
            exercises: [
              { name: "Bench Press", sets: 3, reps: 10, weight: 60 },
              { name: "Pull-ups", sets: 4, reps: 8, weight: 0 },
              { name: "Shoulder Press", sets: 3, reps: 12, weight: 15 },
              { name: "Bicep Curls", sets: 3, reps: 12, weight: 12.5 },
            ],
            caloriesBurned: 280,
            heartRate: { avg: 130, max: 150 },
            notes: "Increased bench press weight by 5kg",
            completed: true,
          },
          {
            id: 3,
            type: "yoga",
            name: "Evening Flow",
            date: today,
            duration: 30,
            caloriesBurned: 150,
            heartRate: { avg: 95, max: 110 },
            notes: "Focused on hip opening poses",
            completed: true,
          },
          {
            id: 4,
            type: "cardio",
            name: "HIIT Treadmill",
            date: today,
            duration: 25,
            caloriesBurned: 300,
            heartRate: { avg: 160, max: 185 },
            notes: "Sprint intervals: 30s on, 60s off",
            completed: true,
          },
        ];

        setWorkouts(sampleWorkouts);
        localStorage.setItem("fitnessWorkouts", JSON.stringify(sampleWorkouts));
      }
    } catch (error) {
      console.error("Error loading fitness workouts:", error);
    }
  }, []);

  const addWorkout = useCallback((workout) => {
    setWorkouts((prev) => {
      const newWorkout = {
        ...workout,
        id: prev.length > 0 ? Math.max(...prev.map((w) => w.id)) + 1 : 1,
        completed: true,
      };

      const updatedWorkouts = [...prev, newWorkout];

      // Save to localStorage
      localStorage.setItem("fitnessWorkouts", JSON.stringify(updatedWorkouts));

      return updatedWorkouts;
    });
  }, []);

  const updateWorkout = useCallback((workout) => {
    setWorkouts((prev) => {
      const workoutIndex = prev.findIndex((w) => w.id === workout.id);

      if (workoutIndex === -1) return prev;

      const updatedWorkouts = [...prev];
      updatedWorkouts[workoutIndex] = workout;

      // Save to localStorage
      localStorage.setItem("fitnessWorkouts", JSON.stringify(updatedWorkouts));

      return updatedWorkouts;
    });
  }, []);

  const deleteWorkout = useCallback((workoutId) => {
    setWorkouts((prev) => {
      const updatedWorkouts = prev.filter((w) => w.id !== workoutId);

      // Save to localStorage
      localStorage.setItem("fitnessWorkouts", JSON.stringify(updatedWorkouts));

      return updatedWorkouts;
    });
  }, []);

  return { workouts, addWorkout, updateWorkout, deleteWorkout };
};

// Custom hook for AI fitness coach
const useAICoach = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load messages from localStorage if available
    try {
      const savedMessages = localStorage.getItem("fitnessAICoach");
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // Initialize with welcome message
        const initialMessage = {
          id: 1,
          role: "assistant",
          content:
            "Hi there! I'm your AI Fitness Coach. I can help you with workout suggestions, nutrition advice, and fitness tips. What would you like to know today?",
          timestamp: new Date().toISOString(),
        };
        setMessages([initialMessage]);
        localStorage.setItem(
          "fitnessAICoach",
          JSON.stringify([initialMessage])
        );
      }
    } catch (error) {
      console.error("Error loading AI coach messages:", error);
    }
  }, []);

  const sendMessage = useCallback(
    async (messageContent, metrics, workouts) => {
      try {
        setIsLoading(true);
        setError(null);

        // Add user message
        const userMessage = {
          id:
            messages.length > 0
              ? Math.max(...messages.map((m) => m.id)) + 1
              : 1,
          role: "user",
          content: messageContent,
          timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        // Prepare context for AI
        let context =
          "You are an AI Fitness Coach helping the user with workout plans, nutrition advice, and fitness tips.";

        // Add user's metrics if available
        if (metrics) {
          context += `\n\nUser's fitness data:
- Weight: ${metrics.bodyStats.weight.value} ${metrics.bodyStats.weight.unit}
- Height: ${metrics.bodyStats.height.value} ${metrics.bodyStats.height.unit}
- BMI: ${metrics.bodyStats.bmi.value}
- Body Fat: ${metrics.bodyStats.bodyFat.value}%
- Fitness levels: Cardio (${metrics.fitnessLevels.cardio.value}%), Strength (${metrics.fitnessLevels.strength.value}%), Flexibility (${metrics.fitnessLevels.flexibility.value}%)
- Daily goals: ${metrics.goals.daily.steps} steps, ${metrics.goals.daily.water} glasses of water
- Weekly goals: ${metrics.goals.weekly.workouts} workouts, ${metrics.goals.weekly.activeMinutes} active minutes
`;
        }

        // Add recent workouts if available
        if (workouts && workouts.length > 0) {
          context += "\n\nRecent workouts:";
          workouts.slice(0, 3).forEach((workout) => {
            context += `\n- ${workout.name} (${workout.type}) on ${workout.date}: ${workout.duration} min`;
          });
        }

        // Call Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `${context}
      
User question: ${messageContent}

Provide a helpful, motivating response focused on fitness. Keep it brief (under 150 words) but informative and actionable. Use an encouraging tone.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        // Add AI response
        const assistantMessage = {
          id:
            updatedMessages.length > 0
              ? Math.max(...updatedMessages.map((m) => m.id)) + 1
              : 1,
          role: "assistant",
          content: aiResponse,
          timestamp: new Date().toISOString(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        // Save to localStorage
        localStorage.setItem("fitnessAICoach", JSON.stringify(finalMessages));

        return assistantMessage;
      } catch (error) {
        console.error("Error sending message to AI coach:", error);
        setError("Failed to get a response. Please try again.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearMessages = useCallback(() => {
    const initialMessage = {
      id: 1,
      role: "assistant",
      content:
        "Hi there! I'm your AI Fitness Coach. I can help you with workout suggestions, nutrition advice, and fitness tips. What would you like to know today?",
      timestamp: new Date().toISOString(),
    };

    setMessages([initialMessage]);
    localStorage.setItem("fitnessAICoach", JSON.stringify([initialMessage]));
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
};

// Calorie calculator component
const CalorieCalculator = ({ onClose, updateMetric }) => {
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [activityLevel, setActivityLevel] = useState("moderately_active");
  const [goal, setGoal] = useState("maintain");
  const [results, setResults] = useState(null);

  const calculateCalories = () => {
    let bmr = 0;

    // BMR calculation using Mifflin-St Jeor Equation
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Apply activity multiplier
    let tdee = 0;
    switch (activityLevel) {
      case "sedentary":
        tdee = bmr * 1.2;
        break;
      case "lightly_active":
        tdee = bmr * 1.375;
        break;
      case "moderately_active":
        tdee = bmr * 1.55;
        break;
      case "very_active":
        tdee = bmr * 1.725;
        break;
      case "extra_active":
        tdee = bmr * 1.9;
        break;
      default:
        tdee = bmr * 1.2;
    }

    // Adjust based on goal
    let goalCalories = tdee;
    let protein = 0;
    let fat = 0;
    let carbs = 0;

    switch (goal) {
      case "lose":
        goalCalories = tdee * 0.85;
        protein = weight * 2.2; // 2.2g per kg bodyweight
        fat = (goalCalories * 0.25) / 9; // 25% of calories from fat
        carbs = (goalCalories - protein * 4 - fat * 9) / 4;
        break;
      case "maintain":
        goalCalories = tdee;
        protein = weight * 1.8; // 1.8g per kg bodyweight
        fat = (goalCalories * 0.3) / 9; // 30% of calories from fat
        carbs = (goalCalories - protein * 4 - fat * 9) / 4;
        break;
      case "gain":
        goalCalories = tdee * 1.15;
        protein = weight * 2.0; // 2.0g per kg bodyweight
        fat = (goalCalories * 0.25) / 9; // 25% of calories from fat
        carbs = (goalCalories - protein * 4 - fat * 9) / 4;
        break;
      default:
        goalCalories = tdee;
    }

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      goalCalories: Math.round(goalCalories),
      macros: {
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs),
      },
    });

    // Save as a custom goal
    const calorieGoal = {
      id: Date.now(),
      name: `${goal.charAt(0).toUpperCase() + goal.slice(1)} weight`,
      target: `${Math.round(goalCalories)} calories per day`,
      progress: 0,
      achieved: false,
      type: "nutrition",
    };

    // Update metrics
    updateMetric("goals", "custom", calorieGoal);
  };

  const activityLabels = {
    sedentary: "Sedentary (office job, little exercise)",
    lightly_active: "Lightly Active (light exercise 1-3 days/week)",
    moderately_active: "Moderately Active (moderate exercise 3-5 days/week)",
    very_active: "Very Active (heavy exercise 6-7 days/week)",
    extra_active: "Extra Active (athlete, physical job, or 2x daily training)",
  };

  const goalLabels = {
    lose: "Lose Weight (15% deficit)",
    maintain: "Maintain Weight",
    gain: "Gain Weight (15% surplus)",
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-2xl w-full border border-slate-700/50 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
          Calorie Calculator
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-800/70"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Gender
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setGender("male")}
              className={`px-4 py-2 rounded-lg flex-1 ${
                gender === "male"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
              }`}
            >
              Male
            </button>
            <button
              onClick={() => setGender("female")}
              className={`px-4 py-2 rounded-lg flex-1 ${
                gender === "female"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
              }`}
            >
              Female
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="age"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Age
          </label>
          <input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label
            htmlFor="weight"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Weight (kg)
          </label>
          <input
            id="weight"
            type="number"
            value={weight}
            onChange={(e) =>
              setWeight(Math.max(1, parseInt(e.target.value) || 0))
            }
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label
            htmlFor="height"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Height (cm)
          </label>
          <input
            id="height"
            type="number"
            value={height}
            onChange={(e) =>
              setHeight(Math.max(1, parseInt(e.target.value) || 0))
            }
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="activityLevel"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Activity Level
          </label>
          <select
            id="activityLevel"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {Object.entries(activityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Goal
          </label>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(goalLabels).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setGoal(value)}
                className={`px-4 py-2 rounded-lg ${
                  goal === value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={calculateCalories}
          className="w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity flex items-center justify-center"
        >
          Calculate
        </button>
      </div>

      {results && (
        <div className="bg-slate-800/70 rounded-lg p-6 border border-slate-700/50">
          <h3 className="text-xl font-medium text-white mb-4">Your Results</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-1">BMR</div>
              <div className="text-xl font-bold text-white">
                {results.bmr} <span className="text-sm font-normal">kcal</span>
              </div>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-1">TDEE</div>
              <div className="text-xl font-bold text-white">
                {results.tdee} <span className="text-sm font-normal">kcal</span>
              </div>
            </div>
            <div className="bg-indigo-900/40 p-3 rounded-lg border border-indigo-500/30">
              <div className="text-sm text-indigo-300 mb-1">
                Target Calories
              </div>
              <div className="text-xl font-bold text-white">
                {results.goalCalories}{" "}
                <span className="text-sm font-normal">kcal</span>
              </div>
            </div>
          </div>

          <h4 className="text-lg font-medium text-white mb-3">
            Recommended Macros
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
              <div className="text-sm text-blue-300 mb-1">Protein</div>
              <div className="text-lg font-bold text-white">
                {results.macros.protein}g
              </div>
              <div className="text-xs text-blue-200/70 mt-1">
                {Math.round(results.macros.protein * 4)} kcal
              </div>
            </div>
            <div className="bg-amber-900/30 p-3 rounded-lg border border-amber-500/30">
              <div className="text-sm text-amber-300 mb-1">Fat</div>
              <div className="text-lg font-bold text-white">
                {results.macros.fat}g
              </div>
              <div className="text-xs text-amber-200/70 mt-1">
                {Math.round(results.macros.fat * 9)} kcal
              </div>
            </div>
            <div className="bg-emerald-900/30 p-3 rounded-lg border border-emerald-500/30">
              <div className="text-sm text-emerald-300 mb-1">Carbs</div>
              <div className="text-lg font-bold text-white">
                {results.macros.carbs}g
              </div>
              <div className="text-xs text-emerald-200/70 mt-1">
                {Math.round(results.macros.carbs * 4)} kcal
              </div>
            </div>
          </div>

          {/* Macro breakdown pie chart */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              Macronutrient Breakdown
            </h4>
            <div className="flex items-center">
              <div className="w-1/3">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Protein", value: results.macros.protein * 4 },
                        { name: "Fat", value: results.macros.fat * 9 },
                        { name: "Carbs", value: results.macros.carbs * 4 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-2/3">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-slate-300">Protein</span>
                    </div>
                    <span className="text-xs text-white">
                      {Math.round(
                        ((results.macros.protein * 4) / results.goalCalories) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-xs text-slate-300">Fat</span>
                    </div>
                    <span className="text-xs text-white">
                      {Math.round(
                        ((results.macros.fat * 9) / results.goalCalories) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                      <span className="text-xs text-slate-300">Carbs</span>
                    </div>
                    <span className="text-xs text-white">
                      {Math.round(
                        ((results.macros.carbs * 4) / results.goalCalories) *
                          100
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-400">
            <p className="mb-2">
              <strong>BMR:</strong> Basal Metabolic Rate - Calories your body
              needs at complete rest
            </p>
            <p>
              <strong>TDEE:</strong> Total Daily Energy Expenditure - Calories
              your body needs with your activity level
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Workout timer component
const WorkoutTimer = ({ onClose }) => {
  const [timerType, setTimerType] = useState("countdown");
  const [countdownTime, setCountdownTime] = useState(30);
  const [roundTime, setRoundTime] = useState(60);
  const [restTime, setRestTime] = useState(15);
  const [rounds, setRounds] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    if (timerType === "countdown") {
      setCurrentTime(countdownTime);
    } else if (timerType === "stopwatch") {
      setCurrentTime(0);
    } else if (timerType === "interval") {
      setCurrentTime(roundTime);
      setCurrentRound(1);
      setIsResting(false);
    }

    setElapsedTime(0);
    setIsRunning(true);

    const startTime = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));

      if (timerType === "countdown") {
        const remaining = countdownTime - Math.floor((now - startTime) / 1000);
        setCurrentTime(Math.max(0, remaining));

        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
        }
      } else if (timerType === "stopwatch") {
        setCurrentTime(Math.floor((now - startTime) / 1000));
      } else if (timerType === "interval") {
        // For interval timer, we need to track rounds and rest periods
        const totalIntervalTime = (roundTime + restTime) * rounds - restTime;
        const elapsed = Math.floor((now - startTime) / 1000);

        if (elapsed >= totalIntervalTime) {
          // Workout complete
          clearInterval(intervalRef.current);
          setIsRunning(false);
          return;
        }

        const currentCycle = Math.floor(elapsed / (roundTime + restTime));
        const timeInCycle = elapsed % (roundTime + restTime);

        if (timeInCycle < roundTime) {
          // We're in a work period
          setCurrentRound(currentCycle + 1);
          setCurrentTime(roundTime - timeInCycle);
          setIsResting(false);
        } else {
          // We're in a rest period
          setCurrentTime(roundTime + restTime - timeInCycle);
          setIsResting(true);
        }
      }
    }, 1000);
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);

    if (timerType === "countdown") {
      setCurrentTime(countdownTime);
    } else if (timerType === "stopwatch") {
      setCurrentTime(0);
    } else if (timerType === "interval") {
      setCurrentTime(0);
      setCurrentRound(0);
      setIsResting(false);
    }

    setElapsedTime(0);
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
          Workout Timer
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-800/70"
        >
          <X size={20} />
        </button>
      </div>

      {/* Timer type tabs */}
      <div className="flex mb-6 bg-slate-800/50 rounded-lg p-1">
        {[
          { id: "countdown", label: "Countdown" },
          { id: "stopwatch", label: "Stopwatch" },
          { id: "interval", label: "Interval" },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => {
              resetTimer();
              setTimerType(type.id);
            }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              timerType === type.id
                ? "bg-indigo-600 text-white"
                : "text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div
        className={`flex items-center justify-center h-40 mb-6 rounded-xl border ${
          isRunning
            ? isResting
              ? "border-amber-500/30 bg-amber-900/20"
              : "border-indigo-500/30 bg-indigo-900/20"
            : "border-slate-700/50 bg-slate-800/50"
        }`}
      >
        <div className="text-center">
          {timerType === "interval" && isRunning && (
            <div className="mb-1 text-sm font-medium">
              {isResting ? "REST" : `ROUND ${currentRound} of ${rounds}`}
            </div>
          )}

          <div
            className={`text-6xl font-bold ${
              isResting ? "text-amber-300" : "text-white"
            }`}
          >
            {formatTime(currentTime)}
          </div>

          {timerType !== "stopwatch" && isRunning && (
            <div className="mt-2 text-xs text-slate-400">
              Total: {formatTime(elapsedTime)}
            </div>
          )}
        </div>
      </div>

      {/* Timer settings */}
      {!isRunning && (
        <>
          {timerType === "countdown" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Countdown Time (seconds)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[30, 60, 90, 120, 180, 300].map((time) => (
                  <button
                    key={time}
                    onClick={() => setCountdownTime(time)}
                    className={`py-2 rounded-lg text-sm ${
                      countdownTime === time
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
                    }`}
                  >
                    {time >= 60 ? `${Math.floor(time / 60)}m` : `${time}s`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {timerType === "interval" && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Work Time (seconds)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[30, 45, 60, 90, 120, 180].map((time) => (
                    <button
                      key={time}
                      onClick={() => setRoundTime(time)}
                      className={`py-2 rounded-lg text-sm ${
                        roundTime === time
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
                      }`}
                    >
                      {time >= 60 ? `${Math.floor(time / 60)}m` : `${time}s`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rest Time (seconds)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 15, 20, 30, 45, 60].map((time) => (
                    <button
                      key={time}
                      onClick={() => setRestTime(time)}
                      className={`py-2 rounded-lg text-sm ${
                        restTime === time
                          ? "bg-amber-600 text-white"
                          : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
                      }`}
                    >
                      {time}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rounds
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 5, 8, 10, 12, 15].map((count) => (
                    <button
                      key={count}
                      onClick={() => setRounds(count)}
                      className={`py-2 rounded-lg text-sm ${
                        rounds === count
                          ? "bg-purple-600 text-white"
                          : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Timer controls */}
      <div
        className={`grid ${isRunning ? "grid-cols-2" : "grid-cols-1"} gap-4`}
      >
        {isRunning ? (
          <>
            <button
              onClick={pauseTimer}
              className="py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors flex items-center justify-center"
            >
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </button>
            <button
              onClick={resetTimer}
              className="py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors flex items-center justify-center"
            >
              <RefreshCcw className="h-5 w-5 mr-2" />
              Reset
            </button>
          </>
        ) : (
          <button
            onClick={startTimer}
            className="py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-medium transition-colors flex items-center justify-center"
          >
            <Play className="h-5 w-5 mr-2" />
            Start
          </button>
        )}
      </div>
    </div>
  );
};

// Body stats form component
const BodyStatsForm = ({ metrics, updateMetric, onClose }) => {
  const today = generateTodayDate();
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState(metrics?.bodyStats?.weight?.value || 70);
  const [bodyFat, setBodyFat] = useState(
    metrics?.bodyStats?.bodyFat?.value || 20
  );
  const [waist, setWaist] = useState(metrics?.bodyStats?.waist?.value || 80);
  const [chest, setChest] = useState(metrics?.bodyStats?.chest?.value || 95);
  const [arms, setArms] = useState(metrics?.bodyStats?.arms?.value || 33);
  const [thighs, setThighs] = useState(metrics?.bodyStats?.thighs?.value || 55);

  const handleSubmit = (e) => {
    e.preventDefault();

    updateMetric("bodyStats", "weight", weight, date);
    updateMetric("bodyStats", "bodyFat", bodyFat, date);
    updateMetric("bodyStats", "waist", waist, date);
    updateMetric("bodyStats", "chest", chest, date);
    updateMetric("bodyStats", "arms", arms, date);
    updateMetric("bodyStats", "thighs", thighs, date);

    onClose();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
          Update Body Stats
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-800/70"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="weight"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Weight (kg)
            </label>
            <input
              id="weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="bodyFat"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Body Fat (%)
            </label>
            <input
              id="bodyFat"
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={(e) => setBodyFat(parseFloat(e.target.value))}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="waist"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Waist (cm)
              </label>
              <input
                id="waist"
                type="number"
                step="0.1"
                value={waist}
                onChange={(e) => setWaist(parseFloat(e.target.value))}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label
                htmlFor="chest"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Chest (cm)
              </label>
              <input
                id="chest"
                type="number"
                step="0.1"
                value={chest}
                onChange={(e) => setChest(parseFloat(e.target.value))}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="arms"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Arms (cm)
              </label>
              <input
                id="arms"
                type="number"
                step="0.1"
                value={arms}
                onChange={(e) => setArms(parseFloat(e.target.value))}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label
                htmlFor="thighs"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Thighs (cm)
              </label>
              <input
                id="thighs"
                type="number"
                step="0.1"
                value={thighs}
                onChange={(e) => setThighs(parseFloat(e.target.value))}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity flex items-center justify-center"
        >
          <Save className="h-5 w-5 mr-2" />
          Save Stats
        </button>
      </form>
    </div>
  );
};

// Main fitness page component
export default function FitnessPage() {
  const router = useRouter();
  const { metrics, updateMetric, deleteCustomGoal } = useMetrics();
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const { messages, isLoading, error, sendMessage, clearMessages } =
    useAICoach();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCalorieCalculator, setShowCalorieCalculator] = useState(false);
  const [showWorkoutTimer, setShowWorkoutTimer] = useState(false);
  const [showBodyStatsForm, setShowBodyStatsForm] = useState(false);
  const [showAddWorkoutForm, setShowAddWorkoutForm] = useState(false);
  const [workoutFormData, setWorkoutFormData] = useState({
    type: "cardio",
    name: "Morning Run",
    date: generateTodayDate(),
    duration: 30,
    distance: 3,
    caloriesBurned: 250,
    heartRate: { avg: 140, max: 170 },
    notes: "",
  });
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef(null);

  // Filter workouts for current month
  const currentMonthWorkouts = useMemo(() => {
    if (!workouts) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return workouts.filter((workout) => {
      const workoutDate = new Date(workout.date);
      return (
        workoutDate.getMonth() === currentMonth &&
        workoutDate.getFullYear() === currentYear
      );
    });
  }, [workouts]);

  // Calculate workout statistics
  const workoutStats = useMemo(() => {
    if (!workouts || workouts.length === 0) return null;

    let totalDuration = 0;
    let totalCalories = 0;
    let totalDistance = 0;
    let workoutsByType = {};

    workouts.forEach((workout) => {
      totalDuration += workout.duration || 0;
      totalCalories += workout.caloriesBurned || 0;
      totalDistance += workout.distance || 0;

      // Count workouts by type
      workoutsByType[workout.type] = (workoutsByType[workout.type] || 0) + 1;
    });

    return {
      totalWorkouts: workouts.length,
      totalDuration,
      totalCalories,
      totalDistance,
      workoutsByType,
    };
  }, [workouts]);

  // BMI color function
  const getBmiColor = (bmi) => {
    if (!bmi) return "text-slate-400";
    if (bmi < 18.5) return "text-blue-400";
    if (bmi < 25) return "text-green-400";
    if (bmi < 30) return "text-yellow-400";
    return "text-red-400";
  };

  const getBmiDescription = (bmi) => {
    if (!bmi) return "Not calculated";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handlers for workout form
  const handleWorkoutFormChange = (field, value) => {
    setWorkoutFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWorkoutSubmit = (e) => {
    e.preventDefault();

    if (editingWorkoutId) {
      updateWorkout({
        ...workoutFormData,
        id: editingWorkoutId,
      });
    } else {
      addWorkout(workoutFormData);
    }

    setShowAddWorkoutForm(false);
    setEditingWorkoutId(null);
    setWorkoutFormData({
      type: "cardio",
      name: "Morning Run",
      date: generateTodayDate(),
      duration: 30,
      distance: 3,
      caloriesBurned: 250,
      heartRate: { avg: 140, max: 170 },
      notes: "",
    });
  };

  const handleEditWorkout = (workout) => {
    setWorkoutFormData(workout);
    setEditingWorkoutId(workout.id);
    setShowAddWorkoutForm(true);
  };

  // Handle progress update
  const handleProgressUpdate = (metric, value) => {
    const today = generateTodayDate();

    // Get current progress
    const current = metrics.progress[metric];

    // Calculate the new value
    const newValue = {
      today: current.today + value,
    };

    // Update metric
    updateMetric("progress", metric, newValue);
  };

  // Handle AI coach message submission
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!chatMessage.trim() || isLoading) return;

    const message = chatMessage;
    setChatMessage("");

    // Send message to AI coach
    await sendMessage(message, metrics, workouts);
  };

  // Chart data for weight history
  const weightHistoryData = useMemo(() => {
    if (!metrics?.bodyStats?.weight?.history) return [];

    return metrics.bodyStats.weight.history
      .map((item) => ({
        date: item.date,
        weight: item.value,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [metrics]);

  // Progress card component
  const ProgressCard = ({ title, current, goal, icon, color }) => {
    const percentage = Math.min(Math.round((current / goal) * 100), 100);

    return (
      <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-4 shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-slate-300">{title}</h3>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}
          >
            {icon}
          </div>
        </div>

        <div className="flex justify-between items-baseline mb-3">
          <div className="text-2xl font-bold text-white">{current}</div>
          <div className="text-sm text-slate-400">of {goal}</div>
        </div>

        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full ${color.replace(
              "text-",
              "bg-"
            )}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        <div className="mt-2 text-xs text-right text-slate-400">
          {percentage}%
        </div>
      </div>
    );
  };

  // Custom goal card component
  const CustomGoalCard = ({ goal, onDelete }) => {
    return (
      <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-white font-medium">{goal.name}</h3>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-1">{goal.target}</p>

        <div className="mt-3">
          <div className="flex justify-between items-center text-xs mb-1">
            <span
              className={goal.achieved ? "text-green-400" : "text-slate-300"}
            >
              {goal.achieved ? "Completed" : `${goal.progress}% complete`}
            </span>
          </div>

          <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full ${
                goal.achieved
                  ? "bg-green-500"
                  : goal.type === "nutrition"
                  ? "bg-amber-500"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${goal.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Render
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
                  Fitness Hub
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
                onClick={() => router.push("/diary")}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Food Diary
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

      {/* Tabs navigation */}
      <div className="bg-slate-900/60 backdrop-blur-sm border-b border-slate-800/60 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              {
                id: "dashboard",
                label: "Dashboard",
                icon: <BarChart2 size={16} />,
              },
              {
                id: "workouts",
                label: "Workouts",
                icon: <Dumbbell size={16} />,
              },
              {
                id: "stats",
                label: "Body Stats",
                icon: <LineChart size={16} />,
              },
              { id: "goals", label: "Goals", icon: <Target size={16} /> },
              {
                id: "coach",
                label: "AI Coach",
                icon: <MessageCircle size={16} />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 flex items-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-white border-b-2 border-indigo-500 font-medium"
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
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Quick actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <button
                  onClick={() => setShowAddWorkoutForm(true)}
                  className="bg-gradient-to-br from-indigo-600/90 to-indigo-700/90 hover:from-indigo-600 hover:to-indigo-700 rounded-xl p-4 shadow-lg border border-indigo-500/20 transition-all hover:shadow-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mb-2">
                    <Dumbbell size={16} className="text-white" />
                  </div>
                  <p className="text-sm font-medium">Add Workout</p>
                </button>

                <button
                  onClick={() => setShowBodyStatsForm(true)}
                  className="bg-gradient-to-br from-purple-600/90 to-purple-700/90 hover:from-purple-600 hover:to-purple-700 rounded-xl p-4 shadow-lg border border-purple-500/20 transition-all hover:shadow-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                    <LineChart size={16} className="text-white" />
                  </div>
                  <p className="text-sm font-medium">Update Stats</p>
                </button>

                <button
                  onClick={() => setShowWorkoutTimer(true)}
                  className="bg-gradient-to-br from-amber-600/90 to-amber-700/90 hover:from-amber-600 hover:to-amber-700 rounded-xl p-4 shadow-lg border border-amber-500/20 transition-all hover:shadow-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                    <Clock size={16} className="text-white" />
                  </div>
                  <p className="text-sm font-medium">Timer</p>
                </button>

                <button
                  onClick={() => setShowCalorieCalculator(true)}
                  className="bg-gradient-to-br from-emerald-600/90 to-emerald-700/90 hover:from-emerald-600 hover:to-emerald-700 rounded-xl p-4 shadow-lg border border-emerald-500/20 transition-all hover:shadow-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                    <BarChart2 size={16} className="text-white" />
                  </div>
                  <p className="text-sm font-medium">Calorie Calculator</p>
                </button>

                <button
                  onClick={() => setActiveTab("coach")}
                  className="bg-gradient-to-br from-blue-600/90 to-blue-700/90 hover:from-blue-600 hover:to-blue-700 rounded-xl p-4 shadow-lg border border-blue-500/20 transition-all hover:shadow-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <p className="text-sm font-medium">Ask Coach</p>
                </button>

                <button
                  onClick={() => router.push("/diary")}
                  className="bg-gradient-to-br from-rose-600/90 to-rose-700/90 hover:from-rose-600 hover:to-rose-700 rounded-xl p-4 shadow-lg border border-rose-500/20 transition-all hover:shadow-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center mb-2">
                    <BookOpen size={16} className="text-white" />
                  </div>
                  <p className="text-sm font-medium">Food Diary</p>
                </button>
              </div>

              {/* Progress overview */}
              <div>
                <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                  Today's Progress
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {metrics?.progress && (
                    <>
                      <ProgressCard
                        title="Steps"
                        current={metrics.progress.steps.today}
                        goal={metrics.goals.daily.steps}
                        icon={<Activity size={16} />}
                        color="text-blue-500"
                      />
                      <ProgressCard
                        title="Water (glasses)"
                        current={metrics.progress.water.today}
                        goal={metrics.goals.daily.water}
                        icon={<Droplet size={16} />}
                        color="text-cyan-500"
                      />
                      <ProgressCard
                        title="Active Minutes"
                        current={metrics.progress.activeMinutes.today}
                        goal={metrics.goals.daily.activeMinutes}
                        icon={<Zap size={16} />}
                        color="text-amber-500"
                      />
                      <ProgressCard
                        title="Calories Burned"
                        current={metrics.progress.caloriesBurned.today}
                        goal={metrics.goals.daily.caloriesBurned}
                        icon={<Flame size={16} />}
                        color="text-red-500"
                      />
                    </>
                  )}
                </div>

                {/* Quick update buttons */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleProgressUpdate("steps", 1000)}
                    className="bg-slate-800/70 hover:bg-blue-900/40 border border-slate-700/50 hover:border-blue-500/30 rounded-lg px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                  >
                    <Activity size={14} className="text-blue-500" />
                    <span>+1000 Steps</span>
                  </button>
                  <button
                    onClick={() => handleProgressUpdate("water", 1)}
                    className="bg-slate-800/70 hover:bg-cyan-900/40 border border-slate-700/50 hover:border-cyan-500/30 rounded-lg px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                  >
                    <Droplet size={14} className="text-cyan-500" />
                    <span>+1 Glass</span>
                  </button>
                  <button
                    onClick={() => handleProgressUpdate("activeMinutes", 15)}
                    className="bg-slate-800/70 hover:bg-amber-900/40 border border-slate-700/50 hover:border-amber-500/30 rounded-lg px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                  >
                    <Zap size={14} className="text-amber-500" />
                    <span>+15 Active Min</span>
                  </button>
                  <button
                    onClick={() => handleProgressUpdate("caloriesBurned", 100)}
                    className="bg-slate-800/70 hover:bg-red-900/40 border border-slate-700/50 hover:border-red-500/30 rounded-lg px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                  >
                    <Flame size={14} className="text-red-500" />
                    <span>+100 Calories</span>
                  </button>
                </div>
              </div>

              {/* Stats summary and workouts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats summary */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-5">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Info size={18} className="text-indigo-400 mr-2" />
                    Key Stats
                  </h3>

                  {metrics && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                        <div className="text-slate-300">Weight</div>
                        <div className="font-medium">
                          {metrics.bodyStats.weight.value}{" "}
                          {metrics.bodyStats.weight.unit}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                        <div className="text-slate-300">BMI</div>
                        <div
                          className={`font-medium ${getBmiColor(
                            metrics.bodyStats.bmi.value
                          )}`}
                        >
                          {metrics.bodyStats.bmi.value} (
                          {getBmiDescription(metrics.bodyStats.bmi.value)})
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                        <div className="text-slate-300">Body Fat</div>
                        <div className="font-medium">
                          {metrics.bodyStats.bodyFat.value}%
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                        <div className="text-slate-300">
                          Workouts this month
                        </div>
                        <div className="font-medium">
                          {currentMonthWorkouts.length}
                        </div>
                      </div>

                      <button
                        onClick={() => setShowBodyStatsForm(true)}
                        className="w-full py-2 mt-2 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 text-white text-sm transition-colors flex items-center justify-center"
                      >
                        <Edit2 size={14} className="mr-2" />
                        Update Stats
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent workouts card */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-5 md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center">
                      <Dumbbell size={18} className="text-indigo-400 mr-2" />
                      Recent Workouts
                    </h3>
                    <button
                      onClick={() => setActiveTab("workouts")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      View All →
                    </button>
                  </div>

                  {workouts && workouts.length > 0 ? (
                    <div className="space-y-3">
                      {workouts.slice(0, 3).map((workout) => (
                        <div
                          key={workout.id}
                          className="flex items-center bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-indigo-500/30 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-indigo-600/30 flex items-center justify-center mr-3 flex-shrink-0">
                            {WORKOUT_TYPES.find(
                              (type) => type.id === workout.type
                            )?.icon || <Dumbbell size={18} />}
                          </div>

                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-white">
                                {workout.name}
                              </h4>
                              <div className="text-xs text-slate-400">
                                {workout.date}
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-slate-300 mt-1">
                              <Clock size={12} className="mr-1" />
                              <span>{workout.duration} min</span>

                              {workout.caloriesBurned && (
                                <>
                                  <span className="mx-1.5">•</span>
                                  <Flame
                                    size={12}
                                    className="mr-1 text-red-400"
                                  />
                                  <span>{workout.caloriesBurned} cal</span>
                                </>
                              )}

                              {workout.distance && (
                                <>
                                  <span className="mx-1.5">•</span>
                                  <span>{workout.distance} km</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => setShowAddWorkoutForm(true)}
                        className="w-full py-2.5 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 text-white text-sm transition-colors flex items-center justify-center"
                      >
                        <Plus size={14} className="mr-2" />
                        Add New Workout
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800/70 flex items-center justify-center mb-4">
                        <Dumbbell size={24} className="text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        No workouts yet
                      </h3>
                      <p className="text-slate-400 mb-4">
                        Start tracking your fitness journey by adding your first
                        workout
                      </p>
                      <button
                        onClick={() => setShowAddWorkoutForm(true)}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors"
                      >
                        Add First Workout
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fitness insights and level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fitness level */}
                {metrics?.fitnessLevels && (
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-5">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                      <Award size={18} className="text-indigo-400 mr-2" />
                      Your Fitness Level
                    </h3>

                    <div className="space-y-4">
                      {Object.entries(metrics.fitnessLevels).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm capitalize text-slate-300">
                                {key}
                              </span>
                              <span className="text-sm font-medium">
                                {value.value}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  key === "cardio"
                                    ? "bg-red-500"
                                    : key === "strength"
                                    ? "bg-blue-500"
                                    : key === "flexibility"
                                    ? "bg-yellow-500"
                                    : key === "endurance"
                                    ? "bg-green-500"
                                    : "bg-purple-500"
                                }`}
                                style={{ width: `${value.value}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-6 p-3 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg border border-indigo-500/20">
                      <div className="flex items-start">
                        <div className="mr-3">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            Fitness Level:{" "}
                            {Object.values(metrics.fitnessLevels).reduce(
                              (sum, item) => sum + item.value,
                              0
                            ) /
                              Object.values(metrics.fitnessLevels).length >
                            75
                              ? "Advanced"
                              : Object.values(metrics.fitnessLevels).reduce(
                                  (sum, item) => sum + item.value,
                                  0
                                ) /
                                  Object.values(metrics.fitnessLevels).length >
                                50
                              ? "Intermediate"
                              : "Beginner"}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1">
                            Keep working out to improve your scores!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI insights */}
                <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center">
                      <ThumbsUp size={18} className="text-indigo-400 mr-2" />
                      AI Recommendations
                    </h3>
                    <button
                      onClick={() => setActiveTab("coach")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Ask Coach →
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg border border-blue-500/20">
                      <h4 className="font-medium text-white flex items-center">
                        <Clock size={15} className="text-blue-400 mr-2" />
                        Workout Schedule
                      </h4>
                      <p className="text-sm text-slate-300 mt-1">
                        Based on your activity, we recommend adding a strength
                        training session to balance your cardio workouts.
                      </p>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg border border-amber-500/20">
                      <h4 className="font-medium text-white flex items-center">
                        <AlertTriangle
                          size={15}
                          className="text-amber-400 mr-2"
                        />
                        Recovery Alert
                      </h4>
                      <p className="text-sm text-slate-300 mt-1">
                        Make sure to prioritize proper recovery between intense
                        workout sessions to prevent injury and maximize results.
                      </p>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-emerald-500/20">
                      <h4 className="font-medium text-white flex items-center">
                        <CheckCircle
                          size={15}
                          className="text-emerald-400 mr-2"
                        />
                        Progress Insight
                      </h4>
                      <p className="text-sm text-slate-300 mt-1">
                        You're making good progress on your walking goals.
                        Consider gradually increasing your step target by 10% to
                        continue improvement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Workouts tab */}
          {activeTab === "workouts" && (
            <motion.div
              key="workouts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text mb-1">
                    My Workouts
                  </h2>
                  <p className="text-slate-400">
                    {workouts.length > 0
                      ? `${workouts.length} workouts logged`
                      : "Start tracking your fitness journey"}
                  </p>
                </div>

                <button
                  onClick={() => setShowAddWorkoutForm(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 rounded-lg text-white font-medium transition-colors flex items-center justify-center"
                >
                  <Plus size={18} className="mr-2" />
                  Add Workout
                </button>
              </div>

              {/* Workout statistics */}
              {workoutStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
                    <div className="text-sm text-slate-400 mb-1">
                      Total Workouts
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {workoutStats.totalWorkouts}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
                    <div className="text-sm text-slate-400 mb-1">
                      Total Duration
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {workoutStats.totalDuration}{" "}
                      <span className="text-sm font-normal">min</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
                    <div className="text-sm text-slate-400 mb-1">
                      Calories Burned
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {workoutStats.totalCalories}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
                    <div className="text-sm text-slate-400 mb-1">Distance</div>
                    <div className="text-2xl font-bold text-white">
                      {workoutStats.totalDistance.toFixed(1)}{" "}
                      <span className="text-sm font-normal">km</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Workout distribution chart */}
              {workoutStats &&
                Object.keys(workoutStats.workoutsByType).length > 0 && (
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 mb-8">
                    <h3 className="text-lg font-bold mb-4">
                      Workout Distribution
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(
                              workoutStats.workoutsByType
                            ).map(([type, count]) => ({
                              name:
                                WORKOUT_TYPES.find((t) => t.id === type)
                                  ?.name || type,
                              value: count,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {Object.keys(workoutStats.workoutsByType).map(
                              (type, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    Object.values(CHART_COLORS)[
                                      index % Object.values(CHART_COLORS).length
                                    ]
                                  }
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              `${value} workouts`,
                              "Count",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              {/* Workout list */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Workout History</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {}}
                      className="p-2 rounded-lg hover:bg-slate-800/70 text-slate-300"
                    >
                      <Filter size={16} />
                    </button>
                    <button
                      onClick={() => {}}
                      className="p-2 rounded-lg hover:bg-slate-800/70 text-slate-300"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  </div>
                </div>

                {workouts.length > 0 ? (
                  <div className="space-y-4">
                    {workouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-4 hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3 flex-shrink-0">
                              {WORKOUT_TYPES.find(
                                (type) => type.id === workout.type
                              )?.icon || <Dumbbell size={18} />}
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                {workout.name}
                              </h4>
                              <div className="flex items-center text-xs text-slate-400 mt-1">
                                <span>{workout.date}</span>
                                <span className="mx-1.5">•</span>
                                <span className="capitalize">
                                  {workout.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditWorkout(workout)}
                              className="p-1.5 rounded-full hover:bg-slate-800/70 text-slate-400 hover:text-white transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteWorkout(workout.id)}
                              className="p-1.5 rounded-full hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">
                              Duration
                            </div>
                            <div className="text-sm font-medium flex items-center">
                              <Clock
                                size={14}
                                className="mr-1 text-indigo-400"
                              />
                              {workout.duration} min
                            </div>
                          </div>

                          {workout.distance && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">
                                Distance
                              </div>
                              <div className="text-sm font-medium">
                                {workout.distance} km
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-xs text-slate-400 mb-1">
                              Calories
                            </div>
                            <div className="text-sm font-medium flex items-center">
                              <Flame size={14} className="mr-1 text-red-400" />
                              {workout.caloriesBurned}
                            </div>
                          </div>
                        </div>

                        {workout.heartRate && (
                          <div className="mt-3 flex items-center">
                            <div className="text-xs bg-red-900/30 text-red-300 px-2 py-1 rounded-md flex items-center">
                              <Heart size={12} className="mr-1" />
                              <span>Avg: {workout.heartRate.avg} bpm</span>
                              <span className="mx-1">|</span>
                              <span>Max: {workout.heartRate.max} bpm</span>
                            </div>
                          </div>
                        )}

                        {workout.notes && (
                          <div className="mt-3 text-xs text-slate-400">
                            <span className="font-medium text-slate-300">
                              Notes:
                            </span>{" "}
                            {workout.notes}
                          </div>
                        )}

                        {workout.exercises && workout.exercises.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-700/50">
                            <h5 className="text-xs font-medium text-slate-300 mb-2">
                              Exercises
                            </h5>
                            <div className="space-y-2">
                              {workout.exercises.map((exercise, i) => (
                                <div
                                  key={i}
                                  className="flex justify-between items-center bg-slate-800/40 rounded-lg p-2 text-xs"
                                >
                                  <span>{exercise.name}</span>
                                  <span className="text-slate-400">
                                    {exercise.sets} × {exercise.reps}
                                    {exercise.weight > 0
                                      ? ` × ${exercise.weight} kg`
                                      : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800/70 flex items-center justify-center mb-4">
                      <Dumbbell size={24} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      No workouts yet
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-6">
                      Track your workouts to see your progress over time and get
                      personalized insights.
                    </p>
                    <button
                      onClick={() => setShowAddWorkoutForm(true)}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                    >
                      Add Your First Workout
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Body Stats tab */}
          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text mb-1">
                    Body Statistics
                  </h2>
                  <p className="text-slate-400">
                    Track your measurements and progress
                  </p>
                </div>

                <button
                  onClick={() => setShowBodyStatsForm(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 rounded-lg text-white font-medium transition-colors flex items-center justify-center whitespace-nowrap"
                >
                  <Plus size={18} className="mr-2" />
                  Update Stats
                </button>
              </div>

              {metrics?.bodyStats && (
                <>
                  {/* Current stats overview */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                    <h3 className="text-lg font-bold mb-4">
                      Current Measurements
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">
                          Weight
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {metrics.bodyStats.weight.value}{" "}
                          <span className="text-sm font-normal">
                            {metrics.bodyStats.weight.unit}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-1">
                          Height
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {metrics.bodyStats.height.value}{" "}
                          <span className="text-sm font-normal">
                            {metrics.bodyStats.height.unit}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-1">BMI</div>
                        <div
                          className={`text-2xl font-bold ${getBmiColor(
                            metrics.bodyStats.bmi.value
                          )}`}
                        >
                          {metrics.bodyStats.bmi.value}
                        </div>
                        <div className="text-xs text-slate-400">
                          {getBmiDescription(metrics.bodyStats.bmi.value)}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-1">
                          Body Fat
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {metrics.bodyStats.bodyFat.value}
                          <span className="text-sm font-normal">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-700/50">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Waist</div>
                        <div className="text-xl font-medium text-white">
                          {metrics.bodyStats.waist.value}{" "}
                          <span className="text-sm font-normal">
                            {metrics.bodyStats.waist.unit}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-1">Chest</div>
                        <div className="text-xl font-medium text-white">
                          {metrics.bodyStats.chest.value}{" "}
                          <span className="text-sm font-normal">
                            {metrics.bodyStats.chest.unit}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-1">Arms</div>
                        <div className="text-xl font-medium text-white">
                          {metrics.bodyStats.arms.value}{" "}
                          <span className="text-sm font-normal">
                            {metrics.bodyStats.arms.unit}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-1">
                          Thighs
                        </div>
                        <div className="text-xl font-medium text-white">
                          {metrics.bodyStats.thighs.value}{" "}
                          <span className="text-sm font-normal">
                            {metrics.bodyStats.thighs.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weight chart */}
                  {weightHistoryData.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                      <h3 className="text-lg font-bold mb-4">Weight History</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={weightHistoryData}
                            margin={{ top: 5, right: 20, bottom: 20, left: 0 }}
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
                                  stopOpacity={0.6}
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
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                              axisLine={{ stroke: "#334155" }}
                              tickLine={{ stroke: "#334155" }}
                            />
                            <YAxis
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                              axisLine={{ stroke: "#334155" }}
                              tickLine={{ stroke: "#334155" }}
                              domain={["dataMin - 1", "dataMax + 1"]}
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
                              dataKey="weight"
                              stroke="#6366f1"
                              strokeWidth={2}
                              fill="url(#weightGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* BMI chart */}
                  {metrics.bodyStats.bmi.history &&
                    metrics.bodyStats.bmi.history.length > 0 && (
                      <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                        <h3 className="text-lg font-bold mb-4">BMI History</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={metrics.bodyStats.bmi.history.map(
                                (item) => ({
                                  date: item.date,
                                  bmi: item.value,
                                })
                              )}
                              margin={{
                                top: 5,
                                right: 20,
                                bottom: 20,
                                left: 0,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#334155"
                              />
                              <XAxis
                                dataKey="date"
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                axisLine={{ stroke: "#334155" }}
                                tickLine={{ stroke: "#334155" }}
                              />
                              <YAxis
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                axisLine={{ stroke: "#334155" }}
                                tickLine={{ stroke: "#334155" }}
                                domain={["dataMin - 1", "dataMax + 1"]}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1e293b",
                                  borderColor: "#475569",
                                  borderRadius: "0.5rem",
                                  color: "#f8fafc",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="bmi"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{
                                  stroke: "#10b981",
                                  strokeWidth: 2,
                                  fill: "#10b981",
                                }}
                                activeDot={{
                                  stroke: "#10b981",
                                  strokeWidth: 3,
                                  r: 6,
                                  fill: "#10b981",
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                  {/* Body composition charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Body fat chart */}
                    {metrics.bodyStats.bodyFat.history &&
                      metrics.bodyStats.bodyFat.history.length > 0 && (
                        <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                          <h3 className="text-base font-bold mb-4">
                            Body Fat Percentage
                          </h3>
                          <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={metrics.bodyStats.bodyFat.history.map(
                                  (item) => ({
                                    date: item.date,
                                    bodyFat: item.value,
                                  })
                                )}
                                margin={{
                                  top: 5,
                                  right: 20,
                                  bottom: 20,
                                  left: 0,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke="#334155"
                                />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                                  axisLine={{ stroke: "#334155" }}
                                  tickLine={{ stroke: "#334155" }}
                                />
                                <YAxis
                                  tick={{ fill: "#94a3b8", fontSize: 12 }}
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
                                    `${value}%`,
                                    "Body Fat",
                                  ]}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="bodyFat"
                                  stroke="#f59e0b"
                                  strokeWidth={2}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                    {/* Measurements radar chart */}
                    <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                      <h3 className="text-base font-bold mb-4">
                        Body Measurements
                      </h3>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            outerRadius={70}
                            data={[
                              {
                                subject: "Waist",
                                value: metrics.bodyStats.waist.value,
                                fullMark: 120,
                              },
                              {
                                subject: "Chest",
                                value: metrics.bodyStats.chest.value,
                                fullMark: 150,
                              },
                              {
                                subject: "Arms",
                                value: metrics.bodyStats.arms.value,
                                fullMark: 60,
                              },
                              {
                                subject: "Thighs",
                                value: metrics.bodyStats.thighs.value,
                                fullMark: 80,
                              },
                            ]}
                          >
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                            />
                            <PolarRadiusAxis
                              angle={30}
                              domain={[0, "auto"]}
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                            />
                            <Radar
                              name="Current"
                              dataKey="value"
                              stroke="#a855f7"
                              fill="#a855f7"
                              fillOpacity={0.5}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                borderColor: "#475569",
                                borderRadius: "0.5rem",
                                color: "#f8fafc",
                              }}
                              formatter={(value) => [
                                `${value} cm`,
                                "Measurement",
                              ]}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Goals tab */}
          {activeTab === "goals" && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text mb-1">
                    Fitness Goals
                  </h2>
                  <p className="text-slate-400">
                    Track and manage your fitness objectives
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCalorieCalculator(true)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center whitespace-nowrap"
                  >
                    <BarChart2 size={18} className="mr-2" />
                    Calorie Calculator
                  </button>

                  <button
                    onClick={() => {
                      // Add custom goal
                      updateMetric("goals", "custom", {
                        id: Date.now(),
                        name: "New Goal",
                        target: "Add your target",
                        progress: 0,
                        achieved: false,
                      });
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 rounded-lg text-white font-medium transition-colors flex items-center justify-center"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Goal
                  </button>
                </div>
              </div>

              {metrics?.goals && (
                <>
                  {/* Daily goals */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 mb-6">
                    <h3 className="text-lg font-bold mb-4">Daily Goals</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {/* Steps */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-slate-300">Steps</div>
                          <div className="text-sm text-slate-400">
                            {metrics.progress.steps.today} /{" "}
                            {metrics.goals.daily.steps}
                          </div>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                          <div
                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                Math.round(
                                  (metrics.progress.steps.today /
                                    metrics.goals.daily.steps) *
                                    100
                                ),
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <div className="flex items-center">
                            <Activity
                              size={10}
                              className="mr-1 text-blue-500"
                            />
                            <span>Daily Steps</span>
                          </div>
                          <div>
                            {Math.round(
                              (metrics.progress.steps.today /
                                metrics.goals.daily.steps) *
                                100
                            )}
                            %
                          </div>
                        </div>
                      </div>

                      {/* Water */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-slate-300">Water</div>
                          <div className="text-sm text-slate-400">
                            {metrics.progress.water.today} /{" "}
                            {metrics.goals.daily.water} glasses
                          </div>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                          <div
                            className="absolute top-0 left-0 h-full bg-cyan-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                Math.round(
                                  (metrics.progress.water.today /
                                    metrics.goals.daily.water) *
                                    100
                                ),
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <div className="flex items-center">
                            <Droplet size={10} className="mr-1 text-cyan-500" />
                            <span>Hydration</span>
                          </div>
                          <div>
                            {Math.round(
                              (metrics.progress.water.today /
                                metrics.goals.daily.water) *
                                100
                            )}
                            %
                          </div>
                        </div>
                      </div>

                      {/* Active Minutes */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-slate-300">
                            Active Minutes
                          </div>
                          <div className="text-sm text-slate-400">
                            {metrics.progress.activeMinutes.today} /{" "}
                            {metrics.goals.daily.activeMinutes} min
                          </div>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                          <div
                            className="absolute top-0 left-0 h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                Math.round(
                                  (metrics.progress.activeMinutes.today /
                                    metrics.goals.daily.activeMinutes) *
                                    100
                                ),
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <div className="flex items-center">
                            <Zap size={10} className="mr-1 text-amber-500" />
                            <span>Activity</span>
                          </div>
                          <div>
                            {Math.round(
                              (metrics.progress.activeMinutes.today /
                                metrics.goals.daily.activeMinutes) *
                                100
                            )}
                            %
                          </div>
                        </div>
                      </div>

                      {/* Calories Burned */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-slate-300">
                            Calories Burned
                          </div>
                          <div className="text-sm text-slate-400">
                            {metrics.progress.caloriesBurned.today} /{" "}
                            {metrics.goals.daily.caloriesBurned}
                          </div>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                          <div
                            className="absolute top-0 left-0 h-full bg-red-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                Math.round(
                                  (metrics.progress.caloriesBurned.today /
                                    metrics.goals.daily.caloriesBurned) *
                                    100
                                ),
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <div className="flex items-center">
                            <Flame size={10} className="mr-1 text-red-500" />
                            <span>Calories</span>
                          </div>
                          <div>
                            {Math.round(
                              (metrics.progress.caloriesBurned.today /
                                metrics.goals.daily.caloriesBurned) *
                                100
                            )}
                            %
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick buttons to update goals */}
                    <div className="mt-6 pt-4 border-t border-slate-700/50 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleProgressUpdate("steps", 1000)}
                        className="bg-slate-800/70 hover:bg-blue-900/40 border border-slate-700/50 hover:border-blue-500/30 rounded-lg px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                      >
                        <Activity size={14} className="text-blue-500" />
                        <span>+1000 Steps</span>
                      </button>
                      <button
                        onClick={() => handleProgressUpdate("water", 1)}
                        className="bg-slate-800/70 hover:bg-cyan-900/40 border border-slate-700/50 hover:border-cyan-500/30 rounded-lg px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                      >
                        <Droplet size={14} className="text-cyan-500" />
                        <span>+1 Glass</span>
                      </button>
                      <button
                        onClick={() =>
                          handleProgressUpdate("activeMinutes", 15)
                        }
                        className="bg-slate-800/70 hover:bg-amber-900/40 border border-slate-700/50 hover:border-amber-500/30 rounded-lg px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                      >
                        <Zap size={14} className="text-amber-500" />
                        <span>+15 Active Min</span>
                      </button>
                      <button
                        onClick={() =>
                          handleProgressUpdate("caloriesBurned", 100)
                        }
                        className="bg-slate-800/70 hover:bg-red-900/40 border border-slate-700/50 hover:border-red-500/30 rounded-lg px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                      >
                        <Flame size={14} className="text-red-500" />
                        <span>+100 Calories</span>
                      </button>
                    </div>
                  </div>

                  {/* Weekly goals */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 mb-6">
                    <h3 className="text-lg font-bold mb-4">Weekly Goals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Workouts */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-slate-300">Workouts</div>
                          <div className="text-sm text-slate-400">
                            {currentMonthWorkouts.length} /{" "}
                            {metrics.goals.weekly.workouts} sessions
                          </div>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                          <div
                            className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                Math.round(
                                  (currentMonthWorkouts.length /
                                    metrics.goals.weekly.workouts) *
                                    100
                                ),
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <div className="flex items-center">
                            <Dumbbell
                              size={10}
                              className="mr-1 text-indigo-500"
                            />
                            <span>Workouts</span>
                          </div>
                          <div>
                            {Math.min(
                              Math.round(
                                (currentMonthWorkouts.length /
                                  metrics.goals.weekly.workouts) *
                                  100
                              ),
                              100
                            )}
                            %
                          </div>
                        </div>
                      </div>

                      {/* Active Minutes */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-slate-300">
                            Active Minutes
                          </div>
                          <div className="text-sm text-slate-400">
                            {metrics.progress.activeMinutes.thisWeek} /{" "}
                            {metrics.goals.weekly.activeMinutes} min
                          </div>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                          <div
                            className="absolute top-0 left-0 h-full bg-purple-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                Math.round(
                                  (metrics.progress.activeMinutes.thisWeek /
                                    metrics.goals.weekly.activeMinutes) *
                                    100
                                ),
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <div className="flex items-center">
                            <Zap size={10} className="mr-1 text-purple-500" />
                            <span>Weekly Activity</span>
                          </div>
                          <div>
                            {Math.min(
                              Math.round(
                                (metrics.progress.activeMinutes.thisWeek /
                                  metrics.goals.weekly.activeMinutes) *
                                  100
                              ),
                              100
                            )}
                            %
                          </div>
                        </div>
                      </div>

                      {/* Distance */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-slate-300">Distance</div>
                          <div className="text-sm text-slate-400">
                            {metrics.progress.distance.thisWeek} /{" "}
                            {metrics.goals.weekly.distance} km
                          </div>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                          <div
                            className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                Math.round(
                                  (metrics.progress.distance.thisWeek /
                                    metrics.goals.weekly.distance) *
                                    100
                                ),
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <div className="flex items-center">
                            <Activity
                              size={10}
                              className="mr-1 text-emerald-500"
                            />
                            <span>Weekly Distance</span>
                          </div>
                          <div>
                            {Math.min(
                              Math.round(
                                (metrics.progress.distance.thisWeek /
                                  metrics.goals.weekly.distance) *
                                  100
                              ),
                              100
                            )}
                            %
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom goals */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Custom Goals</h3>
                      <button
                        onClick={() => {
                          // Add custom goal
                          updateMetric("goals", "custom", {
                            id: Date.now(),
                            name: "New Goal",
                            target: "Add your target",
                            progress: 0,
                            achieved: false,
                          });
                        }}
                        className="p-1.5 rounded hover:bg-slate-800/70 text-slate-300 hover:text-white transition-colors flex items-center"
                      >
                        <Plus size={16} className="mr-1" />
                        <span className="text-xs">Add Goal</span>
                      </button>
                    </div>

                    {metrics.goals.custom.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {metrics.goals.custom.map((goal) => (
                          <CustomGoalCard
                            key={goal.id}
                            goal={goal}
                            onDelete={deleteCustomGoal}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                          <Target size={20} className="text-slate-400" />
                        </div>
                        <h4 className="text-lg font-medium text-white mb-2">
                          No custom goals yet
                        </h4>
                        <p className="text-slate-400 mb-4">
                          Add personal goals to track your individual fitness
                          journey
                        </p>
                        <button
                          onClick={() => {
                            // Add custom goal
                            updateMetric("goals", "custom", {
                              id: Date.now(),
                              name: "New Goal",
                              target: "Add your target",
                              progress: 0,
                              achieved: false,
                            });
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm transition-colors inline-flex items-center"
                        >
                          <Plus size={16} className="mr-2" />
                          Add Your First Goal
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* AI Coach tab */}
          {activeTab === "coach" && (
            <motion.div
              key="coach"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text mb-1">
                    AI Fitness Coach
                  </h2>
                  <p className="text-slate-400">
                    Your personal assistant for fitness and wellness advice
                  </p>
                </div>

                <button
                  onClick={clearMessages}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center"
                >
                  <RefreshCcw size={16} className="mr-2" />
                  New Conversation
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chat section */}
                <div className="md:col-span-2 bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg overflow-hidden flex flex-col h-[600px]">
                  {/* Chat header */}
                  <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-sm p-4 border-b border-slate-700/50 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        Anna AI Fitness Coach
                      </h3>
                      <p className="text-xs text-slate-400">
                        Available 24/7 for fitness advice
                      </p>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                            <MessageCircle className="h-4 w-4 text-white" />
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] rounded-xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white ml-2 rounded-tr-none"
                              : "bg-slate-800/70 text-white border border-slate-700/50 rounded-tl-none"
                          }`}
                        >
                          {message.content}
                        </div>

                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                            <div className="text-xs font-medium text-slate-300">
                              You
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-slate-800/70 rounded-xl rounded-tl-none px-4 py-3 border border-slate-700/50">
                          <div className="flex space-x-2">
                            <div
                              className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
                              style={{ animationDelay: "0s" }}
                            ></div>
                            <div
                              className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef}></div>
                  </div>

                  {/* Chat input */}
                  <div className="p-4 border-t border-slate-700/50">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex space-x-2"
                    >
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Ask your fitness coach..."
                        className="flex-1 bg-slate-800/70 border border-slate-700/50 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !chatMessage.trim()}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 rounded-lg px-4 py-2 text-white font-medium transition-colors"
                      >
                        {isLoading ? (
                          <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                          >
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Suggested questions and info */}
                <div className="space-y-6">
                  {/* Suggested questions */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-5">
                    <h3 className="text-base font-bold mb-4">
                      Suggested Questions
                    </h3>
                    <div className="space-y-2">
                      {[
                        "How can I improve my running performance?",
                        "What's a good workout for core strength?",
                        "How many rest days should I take per week?",
                        "What should I eat before a workout?",
                        "How do I prevent muscle soreness?",
                      ].map((question, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setChatMessage(question);
                            setTimeout(
                              () =>
                                handleSendMessage({ preventDefault: () => {} }),
                              100
                            );
                          }}
                          className="w-full text-left p-2.5 rounded-lg bg-slate-800/70 hover:bg-indigo-900/30 border border-slate-700/50 hover:border-indigo-500/30 text-sm transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Coach capabilities */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-5">
                    <h3 className="text-base font-bold mb-4">
                      Coach Capabilities
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-900/40 flex items-center justify-center mr-3 mt-1 flex-shrink-0 border border-blue-500/30">
                          <Dumbbell className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">
                            Workout Planning
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Get customized workout plans based on your goals and
                            fitness level
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-green-900/40 flex items-center justify-center mr-3 mt-1 flex-shrink-0 border border-green-500/30">
                          <BookOpen className="h-4 w-4 text-green-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">
                            Nutrition Advice
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Learn about proper nutrition to support your fitness
                            journey
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-amber-900/40 flex items-center justify-center mr-3 mt-1 flex-shrink-0 border border-amber-500/30">
                          <Target className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">
                            Goal Setting
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Help with setting realistic and achievable fitness
                            goals
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-purple-900/40 flex items-center justify-center mr-3 mt-1 flex-shrink-0 border border-purple-500/30">
                          <BarChart2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">
                            Progress Analysis
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Get insights on your progress and areas for
                            improvement
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>

      {/* Modals */}
      {/* Calorie Calculator Modal */}
      {showCalorieCalculator && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <CalorieCalculator
            onClose={() => setShowCalorieCalculator(false)}
            updateMetric={updateMetric}
          />
        </div>
      )}

      {/* Workout Timer Modal */}
      {showWorkoutTimer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <WorkoutTimer onClose={() => setShowWorkoutTimer(false)} />
        </div>
      )}

      {/* Body Stats Form Modal */}
      {showBodyStatsForm && metrics && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <BodyStatsForm
            metrics={metrics}
            updateMetric={updateMetric}
            onClose={() => setShowBodyStatsForm(false)}
          />
        </div>
      )}

      {/* Add/Edit Workout Form Modal */}
      {showAddWorkoutForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                {editingWorkoutId ? "Edit Workout" : "Add Workout"}
              </h2>
              <button
                onClick={() => {
                  setShowAddWorkoutForm(false);
                  setEditingWorkoutId(null);
                }}
                className="p-2 rounded-full hover:bg-slate-800/70"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWorkoutSubmit} className="space-y-4">
              {/* Workout type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Workout Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {WORKOUT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleWorkoutFormChange("type", type.id)}
                      className={`py-2 px-3 rounded-lg flex flex-col items-center justify-center ${
                        workoutFormData.type === type.id
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-slate-600/50"
                      }`}
                    >
                      <div className="mb-1">{type.icon}</div>
                      <span className="text-xs">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Workout name */}
              <div>
                <label
                  htmlFor="workoutName"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Workout Name
                </label>
                <input
                  id="workoutName"
                  type="text"
                  value={workoutFormData.name}
                  onChange={(e) =>
                    handleWorkoutFormChange("name", e.target.value)
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g. Morning Run"
                  required
                />
              </div>

              {/* Date and duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="workoutDate"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Date
                  </label>
                  <input
                    id="workoutDate"
                    type="date"
                    value={workoutFormData.date}
                    onChange={(e) =>
                      handleWorkoutFormChange("date", e.target.value)
                    }
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="workoutDuration"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Duration (min)
                  </label>
                  <input
                    id="workoutDuration"
                    type="number"
                    min="1"
                    value={workoutFormData.duration}
                    onChange={(e) =>
                      handleWorkoutFormChange(
                        "duration",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                  />
                </div>
              </div>

              {/* Conditional fields based on workout type */}
              {workoutFormData.type === "cardio" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="workoutDistance"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Distance (km)
                    </label>
                    <input
                      id="workoutDistance"
                      type="number"
                      min="0"
                      step="0.1"
                      value={workoutFormData.distance}
                      onChange={(e) =>
                        handleWorkoutFormChange(
                          "distance",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="workoutCalories"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Calories Burned
                    </label>
                    <input
                      id="workoutCalories"
                      type="number"
                      min="0"
                      value={workoutFormData.caloriesBurned}
                      onChange={(e) =>
                        handleWorkoutFormChange(
                          "caloriesBurned",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              )}

              {workoutFormData.type !== "cardio" && (
                <div>
                  <label
                    htmlFor="workoutCalories"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Calories Burned
                  </label>
                  <input
                    id="workoutCalories"
                    type="number"
                    min="0"
                    value={workoutFormData.caloriesBurned}
                    onChange={(e) =>
                      handleWorkoutFormChange(
                        "caloriesBurned",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              )}

              {/* Heart rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="workoutAvgHr"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Avg Heart Rate (bpm)
                  </label>
                  <input
                    id="workoutAvgHr"
                    type="number"
                    min="0"
                    value={workoutFormData.heartRate.avg}
                    onChange={(e) =>
                      handleWorkoutFormChange("heartRate", {
                        ...workoutFormData.heartRate,
                        avg: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="workoutMaxHr"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Max Heart Rate (bpm)
                  </label>
                  <input
                    id="workoutMaxHr"
                    type="number"
                    min="0"
                    value={workoutFormData.heartRate.max}
                    onChange={(e) =>
                      handleWorkoutFormChange("heartRate", {
                        ...workoutFormData.heartRate,
                        max: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="workoutNotes"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Notes
                </label>
                <textarea
                  id="workoutNotes"
                  value={workoutFormData.notes}
                  onChange={(e) =>
                    handleWorkoutFormChange("notes", e.target.value)
                  }
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="How did the workout feel? Any achievements or challenges?"
                ></textarea>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                <Save className="h-5 w-5 mr-2" />
                {editingWorkoutId ? "Update Workout" : "Save Workout"}
              </button>
            </form>
          </div>
        </div>
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
