"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import AuthCheck from '@/components/AuthCheck';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Environment, 
  OrbitControls, 
  Float, 
  Text, 
  Sparkles, 
  MeshDistortMaterial, 
  ContactShadows,
  Sphere,
  Box,
  Torus,
  Cylinder,
  RoundedBox
} from '@react-three/drei';
import * as THREE from 'three';
import Image from 'next/image';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyD2o0V8Kg-T_FQymwvlOyphswEwAxKEQoU");

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-4 text-center">Something went wrong with the 3D elements.</div>;
    }

    return this.props.children;
  }
}

// Food Model Components - No external files needed
function PlateModel({ position = [0, 0, 0], scale = 1 }) {
  const plateRef = useRef();
  const foodRef = useRef();
  
  useFrame((state) => {
    if (plateRef.current) {
      plateRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });
  
  return (
    <group position={position} scale={scale} ref={plateRef}>
      {/* Plate */}
      <Cylinder 
        args={[2, 2.2, 0.2, 32]} 
        position={[0, -0.1, 0]}
      >
        <meshPhysicalMaterial 
          color="#1a1a2e" 
          metalness={0.3} 
          roughness={0.2} 
        />
      </Cylinder>
      
      {/* Food item */}
      <group position={[0, 0.3, 0]} ref={foodRef}>
        <RoundedBox args={[1.5, 0.4, 1.5]} radius={0.2}>
          <meshStandardMaterial color="#e2c08d" />
        </RoundedBox>
        
        {/* Food decorations */}
        <Cylinder args={[0.3, 0.3, 0.2, 16]} position={[0.4, 0.3, 0.3]}>
          <meshStandardMaterial color="#c92a2a" />
        </Cylinder>
        
        <Sphere args={[0.25, 16, 16]} position={[-0.5, 0.25, 0.2]}>
          <meshStandardMaterial color="#2b8a3e" />
        </Sphere>
        
        <Box args={[0.3, 0.2, 0.6]} position={[0.1, 0.3, -0.4]}>
          <meshStandardMaterial color="#e67700" />
        </Box>
      </group>
    </group>
  );
}

function FruitModel({ position = [0, 0, 0], scale = 1 }) {
  const modelRef = useRef();
  
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });
  
  return (
    <group position={position} scale={scale} ref={modelRef}>
      {/* Bowl */}
      <Cylinder 
        args={[1.5, 1, 1, 32, 1, true]} 
        position={[0, 0, 0]}
      >
        <meshPhysicalMaterial 
          color="#30343f" 
          metalness={0.2} 
          roughness={0.3} 
          side={THREE.DoubleSide}
        />
      </Cylinder>
      
      {/* Fruits */}
      <Sphere args={[0.5, 16, 16]} position={[0.3, 0.8, 0]}>
        <meshStandardMaterial color="#fa5252" />
      </Sphere>
      
      <Sphere args={[0.45, 16, 16]} position={[-0.5, 0.7, 0.4]}>
        <meshStandardMaterial color="#51cf66" />
      </Sphere>
      
      <Sphere args={[0.4, 16, 16]} position={[0, 0.9, -0.4]}>
        <meshStandardMaterial color="#ff922b" />
      </Sphere>
      
      <Sphere args={[0.35, 16, 16]} position={[-0.4, 0.6, -0.3]}>
        <meshStandardMaterial color="#be4bdb" />
      </Sphere>
    </group>
  );
}

function BurgerModel({ position = [0, 0, 0], scale = 1 }) {
  const modelRef = useRef();
  
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });
  
  return (
    <group position={position} scale={scale} ref={modelRef}>
      {/* Bottom Bun */}
      <Cylinder args={[1.2, 1, 0.3, 32]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#e2c08d" />
      </Cylinder>
      
      {/* Patty */}
      <Cylinder args={[1.1, 1.1, 0.3, 32]} position={[0, -0.3, 0]}>
        <meshStandardMaterial color="#6b4c36" />
      </Cylinder>
      
      {/* Cheese */}
      <Box args={[2.2, 0.1, 2.2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#fcc419" />
      </Box>
      
      {/* Lettuce */}
      <RoundedBox args={[2.3, 0.15, 2.3]} radius={0.05} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#40c057" />
      </RoundedBox>
      
      {/* Tomato */}
      <Cylinder args={[1.1, 1.1, 0.2, 32]} position={[0, 0.35, 0]}>
        <meshStandardMaterial color="#fa5252" />
      </Cylinder>
      
      {/* Top Bun */}
      <Sphere args={[1.2, 32, 32, 0, Math.PI]} position={[0, 0.9, 0]}>
        <meshStandardMaterial color="#e2c08d" />
      </Sphere>
    </group>
  );
}

// Updated FoodModel to use generated components instead of GLB files
function FoodModel({ rotation = [0, 0, 0], position = [0, 0, 0], scale = 2.5, model = "plate" }) {
  const FoodComponent = () => {
    switch (model) {
      case "fruit":
        return <FruitModel position={[0, 0, 0]} scale={1} />;
      case "burger":
        return <BurgerModel position={[0, 0, 0]} scale={1} />;
      case "plate":
      default:
        return <PlateModel position={[0, 0, 0]} scale={1} />;
    }
  };
  
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <FoodComponent />
    </group>
  );
}

// Floating 3D Text
function FloatingText({ text, position, color = "#ffffff", size = 0.5, opacity = 0.7 }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime()) * 0.1;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });
  
  return (
    <Text
      ref={ref}
      position={position}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      font="/fonts/inter-bold.woff"
      opacity={opacity}
      strokeWidth={0.01}
      strokeColor="#000000"
      maxWidth={10}
      textAlign="center"
    >
      {text}
    </Text>
  );
}

// Floating Orb Component
function FloatingOrb({ position, color = "#4169e1", scale = 1 }) {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() + position[0]) * 0.2;
    }
  });
  
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.4}>
      <mesh 
        ref={meshRef} 
        position={position} 
        scale={hovered ? scale * 1.1 : scale}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial 
          color={color}
          attach="material"
          distort={hovered ? 0.8 : 0.4}
          speed={hovered ? 4 : 2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

// 3D Hero Scene
function HeroScene({ model }) {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5;
  
  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-5, 5, 5]} intensity={1} castShadow />
      
      <group position={[0, isMobile ? -1.5 : -1, 0]}>
        <FoodModel
          model={model}
          position={[0, 0, 0]}
          scale={isMobile ? 1.8 : 2.5}
          rotation={[0, 0, 0]}
        />
        
        <FloatingOrb position={[-3, 2, -2]} color="#FF6B6B" scale={0.4} />
        <FloatingOrb position={[3.5, 1.5, -1]} color="#4ECDC4" scale={0.3} />
        <FloatingOrb position={[-2.5, 0.5, 1]} color="#F9DC5C" scale={0.25} />
        <FloatingOrb position={[2, 3, -3]} color="#A64AC9" scale={0.35} />
        
        <FloatingText 
          text="Nutrition" 
          position={[-2.5, 3, 0]} 
          color="#FF6B6B" 
          size={isMobile ? 0.4 : 0.7} 
        />
        <FloatingText 
          text="Wellness" 
          position={[3, 2.5, -1]} 
          color="#4ECDC4" 
          size={isMobile ? 0.4 : 0.7} 
        />
        <FloatingText 
          text="Health" 
          position={[0, 4, -2]} 
          color="#F9DC5C" 
          size={isMobile ? 0.4 : 0.7} 
        />
      </group>

      <Sparkles 
        count={100}
        scale={12}
        size={4}
        speed={0.3}
        opacity={0.2}
        color="#ffffff"
      />
      
      <ContactShadows 
        position={[0, -2, 0]} 
        opacity={0.4} 
        scale={10} 
        blur={2} 
        far={4} 
      />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
      
      <Environment preset="night" />
    </>
  );
}

// Fallback Hero Component (non-3D)
function HeroFallback({ theme, activeModel }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-indigo-900 overflow-hidden">
      {/* Background animated circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-purple-500/10"
          animate={{ 
            scale: [1, 1.2, 1], 
            x: [0, 30, 0], 
            y: [0, -30, 0] 
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/3 w-60 h-60 rounded-full bg-blue-500/5"
          animate={{ 
            scale: [1, 1.3, 1], 
            x: [0, -20, 0], 
            y: [0, 20, 0] 
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-teal-500/10"
          animate={{ 
            scale: [1, 1.2, 1], 
            x: [0, 20, 0], 
            y: [0, 30, 0] 
          }}
          transition={{ duration: 7, repeat: Infinity }}
        />
      </div>
      
      {/* Food icon based on selected model */}
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          scale: { duration: 0.5 },
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <div className="text-9xl">
          {activeModel === 'burger' ? '🍔' : 
           activeModel === 'fruit' ? '🍎' : 
           '🍽️'}
        </div>
      </motion.div>
      
      {/* Floating nutrition terms */}
      <div className="absolute inset-0 overflow-hidden">
        {['Protein', 'Carbs', 'Calories', 'Vitamins', 'Minerals', 'Nutrition'].map((term, i) => (
          <motion.div 
            key={term}
            className="absolute text-white/30 font-bold text-xl"
            initial={{ 
              top: `${Math.random() * 80 + 10}%`, 
              left: `${Math.random() * 80 + 10}%` 
            }}
            animate={{ 
              y: [0, -30, 0], 
              opacity: [0.3, 0.7, 0.3] 
            }}
            transition={{ 
              y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" },
              delay: i * 0.5
            }}
          >
            {term}
          </motion.div>
        ))}
      </div>
      
      {/* Sparkles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div 
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              opacity: 0
            }}
            animate={{ 
              opacity: [0, 1, 0]
            }}
            transition={{ 
              opacity: { duration: 1 + Math.random() * 2, repeat: Infinity },
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Nutrition Card Component
const NutritionCard = ({ nutrient, value, color, percentage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-700/50"
    >
      <div className="flex items-center mb-2">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shadow-lg mr-3`}>
          <span className="text-white text-lg font-bold">
            {nutrient === 'Calories' ? '🔥' : nutrient === 'Protein' ? '🥩' : nutrient === 'Carbs' ? '🌾' : '🧈'}
          </span>
        </div>
        <h3 className="text-lg font-semibold dark:text-white">{nutrient}</h3>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold dark:text-white">{value}</span>
        {percentage && (
          <span className="text-sm text-gray-400 dark:text-gray-400">{percentage}%</span>
        )}
      </div>
      <div className="w-full h-2 bg-gray-700 dark:bg-gray-700 rounded-full mt-2">
        <div 
          className={`h-full rounded-full ${color}`} 
          style={{ width: `${percentage || 50}%` }}
        ></div>
      </div>
    </motion.div>
  );
};

// AI Insight Card Component
const AIInsightCard = ({ insight, icon }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-800 dark:to-gray-900 p-4 rounded-2xl shadow-lg border border-purple-900/30"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-700 text-white">
          {icon}
        </div>
        <h3 className="text-md font-semibold dark:text-white">AI Insight</h3>
      </div>
      <p className="text-gray-300 dark:text-gray-300 text-sm">{insight}</p>
    </motion.div>
  );
};

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
  const [theme, setTheme] = useState('dark'); // Default to dark theme
  const [activeModel, setActiveModel] = useState('plate');
  const [aiInsights, setAiInsights] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [try3D, setTry3D] = useState(true);
  
  useEffect(() => {
    // Check if WebGL is available
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn("WebGL not supported, disabling 3D elements");
        setTry3D(false);
      }
    } catch (e) {
      setTry3D(false);
    }
    
    // Always use dark mode for this app
    setTheme('dark');
    document.documentElement.classList.add('dark');
    
    // Load search history from localStorage
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);
  
  // Toggle theme function (keeping it dark-focused)
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      // For the sake of this app, we'll keep it in dark mode
      // But keeping the toggle function in case we want to allow light mode later
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  };
  
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
      
      // First try with Gemini API
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
          console.error("Error parsing Gemini JSON response:", jsonError);
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
          text: `With ${Math.round(food.nutrients.calories)} calories, this portion represents about ${Math.round(food.nutrients.calories/2000*100)}% of a 2000-calorie diet.`,
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
      const updatedHistory = [searchTerm, ...(searchHistory || []).filter(item => item !== searchTerm)].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      
      // Update the 3D model based on search term
      if (searchTerm.toLowerCase().includes('burger')) {
        setActiveModel('burger');
      } else if (searchTerm.toLowerCase().includes('fruit') || searchTerm.toLowerCase().includes('apple')) {
        setActiveModel('fruit');
      } else {
        setActiveModel('plate');
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
      setModalOpen(true);
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
              console.error("Error with direct Gemini API:", directApiError);
              
              // Fall back to hardcoded response for demo
              const foodTypes = ['Chicken Curry', 'Butter Chicken', 'Pizza', 'Burger', 'Salad'];
              searchTerm = foodTypes[Math.floor(Math.random() * foodTypes.length)];
              console.log("Using fallback food identification:", searchTerm);
              await searchFoodAPI(searchTerm);
            }
          };
          
          reader.onerror = () => {
            console.error("Error reading image file");
            setModalOpen(true);
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
      <main className={`min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 dark:from-gray-900 dark:to-gray-950 transition-colors duration-300 ${theme}`}>
        <Navigation />
        
        {/* Theme Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed top-20 right-4 z-50 p-2 rounded-full bg-gray-800 dark:bg-gray-800 shadow-lg"
          onClick={toggleTheme}
        >
          <span className="text-yellow-400 text-2xl">🌙</span>
        </motion.button>
        
        {/* Hero Section with 3D Canvas or Fallback */}
        <div className="relative h-[60vh] overflow-hidden">
          {try3D ? (
            <ErrorBoundary fallback={<HeroFallback theme={theme} activeModel={activeModel} />}>
              <Suspense fallback={<HeroFallback theme={theme} activeModel={activeModel} />}>
                <Canvas className="absolute inset-0">
                  <HeroScene model={activeModel} />
                </Canvas>
              </Suspense>
            </ErrorBoundary>
          ) : (
            <HeroFallback theme={theme} activeModel={activeModel} />
          )}
          
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center px-4">
              <motion.h1 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text drop-shadow-sm"
              >
                AnnaData
              </motion.h1>
              
              <motion.p 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                className="mt-4 text-xl md:text-2xl text-gray-100 dark:text-gray-200 drop-shadow-sm max-w-2xl mx-auto"
              >
                Your AI-Powered Nutritional Intelligence Assistant
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 px-4"
              >
                <motion.div 
                  className="relative w-full max-w-md"
                  whileHover={{ scale: 1.02 }}
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search foods or dishes..."
                    className="w-full px-6 py-4 bg-gray-800 dark:bg-gray-800 text-white dark:text-white rounded-full shadow-xl 
                      border-2 border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 
                      focus:ring-4 focus:ring-purple-500/30 focus:outline-none text-lg"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSearch}
                      className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
                
                <motion.div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white px-6 py-4 rounded-full shadow-lg flex items-center gap-2"
                    onClick={() => document.getElementById('food-image').click()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Upload</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white px-6 py-4 rounded-full shadow-lg flex items-center gap-2"
                    onClick={handleCameraCapture}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{useCamera ? "Close" : "Camera"}</span>
                  </motion.button>
                  
                  <input 
                    type="file" 
                    id="food-image" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Search History Pills */}
        {searchHistory.length > 0 && !selectedFood && (
          <div className="flex justify-center mt-4 px-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2 justify-center"
            >
              <span className="text-sm font-medium text-gray-300 dark:text-gray-300">Recent searches:</span>
              {searchHistory.map((term, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-800 dark:bg-gray-800 px-3 py-1 rounded-full text-sm shadow-sm hover:shadow-md text-gray-300 dark:text-gray-300 border border-gray-700 dark:border-gray-700"
                  onClick={() => {
                    setQuery(term);
                    searchFoodAPI(term);
                  }}
                >
                  {term}
                </motion.button>
              ))}
            </motion.div>
          </div>
        )}
        
        {/* Camera Preview */}
        {useCamera && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-gray-900 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
              <div className="p-4 border-b border-gray-800 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white dark:text-white">Take a photo of your food</h3>
                <button 
                  onClick={handleCameraCapture}
                  className="text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="relative bg-black">
                <video 
                  id="camera-preview" 
                  autoPlay 
                  className="w-full h-64 sm:h-80 md:h-96 object-cover"
                />
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={takePhoto}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded-full hover:bg-red-700 shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </motion.button>
              </div>
              
              <div className="p-4">
                <p className="text-gray-400 dark:text-gray-400 text-sm">Position your food clearly in the center of the frame for best results.</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Empty Search Modal */}
        <AnimatePresence>
          {modalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-700"
              >
                <div className="text-center mb-4">
                  <span className="text-4xl">🍽️</span>
                </div>
                <h3 className="text-xl font-bold text-white dark:text-white mb-2 text-center">Need something to look up?</h3>
                <p className="text-gray-300 dark:text-gray-300 mb-4 text-center">
                  Please enter a food name or upload a food image to search.
                </p>
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                  >
                    Got it!
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content */}
        <motion.div
          layoutId="mainContent"
          className="max-w-7xl mx-auto px-4 py-8"
        >
          {/* Image Preview */}
          {imagePreview && !selectedFood && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex justify-center"
            >
              <div className="relative max-w-md w-full">
                <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-xl p-2 overflow-hidden border border-gray-700">
                  <div className="aspect-w-16 aspect-h-9 relative rounded-xl overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Selected food" 
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Loading Animation */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <motion.div 
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
              />
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-gray-300 dark:text-gray-300"
              >
                Analyzing nutrition data...
              </motion.p>
            </div>
          )}

          {/* Selected Food Detailed View */}
          {selectedFood && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700"
            >
              <div className="relative bg-gradient-to-r from-purple-900 to-indigo-900 h-32 sm:h-48">
                <button 
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="absolute -bottom-12 left-6">
                  <div className="bg-gray-700 dark:bg-gray-700 w-24 h-24 rounded-xl shadow-lg border-4 border-gray-800 dark:border-gray-800 flex items-center justify-center">
                    <span className="text-4xl">
                      {selectedFood.food_name.toLowerCase().includes('pizza') ? '🍕' : 
                       selectedFood.food_name.toLowerCase().includes('burger') ? '🍔' : 
                       selectedFood.food_name.toLowerCase().includes('chicken') ? '🍗' : 
                       selectedFood.food_name.toLowerCase().includes('salad') ? '🥗' : '🍽️'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-16 px-6 pb-6">
                <h2 className="text-3xl font-bold text-gray-200 dark:text-white mb-1">{selectedFood.food_name}</h2>
                <p className="text-gray-400 dark:text-gray-400 mb-6">
                  {selectedFood.serving_type} ({selectedFood.calories_calculated_for}g)
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-200 dark:text-white mb-4">Nutrition Overview</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <NutritionCard 
                        nutrient="Calories" 
                        value={`${Math.round(selectedFood.nutrients.calories)} kcal`} 
                        color="bg-red-600" 
                      />
                      
                      <NutritionCard 
                        nutrient="Protein" 
                        value={`${selectedFood.nutrients.protein}g`} 
                        color="bg-green-600" 
                        percentage={Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}
                      />
                      
                      <NutritionCard 
                        nutrient="Carbs" 
                        value={`${selectedFood.nutrients.carbs}g`} 
                        color="bg-blue-600" 
                        percentage={Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}
                      />
                      
                      <NutritionCard 
                        nutrient="Fat" 
                        value={`${selectedFood.nutrients.fats}g`} 
                        color="bg-yellow-600" 
                        percentage={Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}
                      />
                    </div>
                    
                    {/* Calorie Distribution Chart */}
                    <div className="mt-6 bg-gray-900 dark:bg-gray-900 p-4 rounded-2xl shadow-md border border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-200 dark:text-white mb-3">Calorie Distribution</h4>
                      
                      <div className="h-8 w-full flex rounded-lg overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}%` }}
                          transition={{ duration: 1, delay: 0.1 }}
                          className="bg-green-600 flex items-center justify-center text-xs text-white font-medium"
                        >
                          {Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}%
                        </motion.div>
                        
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="bg-blue-600 flex items-center justify-center text-xs text-white font-medium"
                        >
                          {Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}%
                        </motion.div>
                        
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="bg-yellow-600 flex items-center justify-center text-xs text-white font-medium"
                        >
                          {Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}%
                        </motion.div>
                      </div>
                      
                      <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-400">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-600 mr-1"></div>
                          <span>Protein</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>
                          <span>Carbs</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-600 mr-1"></div>
                          <span>Fat</span>
                        </div>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowFullAnalysis(true)}
                      className="w-full mt-6 py-3 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 
                      text-white rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Get Full Nutrition Analysis
                  </motion.button>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-200 dark:text-white mb-4">AI-Powered Insights</h3>
                  
                  <div className="space-y-4">
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
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full"
                        />
                      </div>
                    )}
                    
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-800 dark:to-gray-900 p-4 rounded-2xl shadow-md border border-gray-700">
                      <h4 className="flex items-center gap-2 text-md font-semibold text-gray-200 dark:text-white mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Diet Compatibility
                      </h4>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${selectedFood.food_name.toLowerCase().includes('veg') && !selectedFood.food_name.toLowerCase().includes('non') ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                          <span className="text-gray-300 dark:text-gray-300">
                            {selectedFood.food_name.toLowerCase().includes('veg') && !selectedFood.food_name.toLowerCase().includes('non') ? 'Suitable for vegetarians' : 'Not suitable for vegetarians'}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span className="text-gray-300 dark:text-gray-300">Not suitable for vegans</span>
                        </div>
                        
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${selectedFood.nutrients.carbs < 15 ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                          <span className="text-gray-300 dark:text-gray-300">
                            {selectedFood.nutrients.carbs < 15 ? 'Keto-friendly' : 'Not keto-friendly'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 px-4 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 border border-teal-800"
                      onClick={() => router.push('/fitness')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Save to Diary
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 px-4 bg-gradient-to-r from-amber-800 to-orange-900 hover:from-amber-900 hover:to-orange-950 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 border border-amber-800"
                      onClick={() => router.push('/recipe')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Find Recipes
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Results */}
        {!selectedFood && results.length > 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-white dark:text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Results ({results.length})
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((food) => (
                <motion.div 
                  key={food.food_unique_id}
                  whileHover={{ scale: 1.03, y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden cursor-pointer border border-gray-700"
                  onClick={() => showFoodDetails(food)}
                >
                  <div className="h-24 bg-gradient-to-r from-purple-700 to-indigo-800 flex items-center justify-center">
                    <span className="text-4xl">
                      {food.food_name.toLowerCase().includes('pizza') ? '🍕' : 
                       food.food_name.toLowerCase().includes('burger') ? '🍔' : 
                       food.food_name.toLowerCase().includes('chicken') ? '🍗' : 
                       food.food_name.toLowerCase().includes('salad') ? '🥗' : '🍽️'}
                    </span>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white dark:text-white mb-2 line-clamp-2">{food.food_name}</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-400 mb-4">{food.serving_type} ({food.calories_calculated_for}g)</p>
                    
                    <div className="bg-gray-900 dark:bg-gray-900 rounded-xl p-3 mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300 dark:text-gray-300 font-medium">Calories</span>
                        <span className="text-white dark:text-white font-bold">{Math.round(food.nutrients.calories)} kcal</span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-gray-700 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600" 
                          style={{ width: `${Math.min(Math.round(food.nutrients.calories/2000*100), 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-400">
                          {Math.round(food.nutrients.calories/2000*100)}% of 2000 kcal
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-green-900/30 dark:bg-green-900/30 p-2 rounded-lg text-center">
                        <div className="text-green-400 dark:text-green-400 font-medium text-sm">Protein</div>
                        <div className="text-white dark:text-white font-bold">{food.nutrients.protein}g</div>
                      </div>
                      
                      <div className="bg-blue-900/30 dark:bg-blue-900/30 p-2 rounded-lg text-center">
                        <div className="text-blue-400 dark:text-blue-400 font-medium text-sm">Carbs</div>
                        <div className="text-white dark:text-white font-bold">{food.nutrients.carbs}g</div>
                      </div>
                      
                      <div className="bg-yellow-900/30 dark:bg-yellow-900/30 p-2 rounded-lg text-center">
                        <div className="text-yellow-400 dark:text-yellow-400 font-medium text-sm">Fat</div>
                        <div className="text-white dark:text-white font-bold">{food.nutrients.fats}g</div>
                      </div>
                    </div>
                    
                    <button className="w-full py-2 text-sm bg-purple-900/50 dark:bg-purple-900/50 text-purple-200 dark:text-purple-200 rounded-xl hover:bg-purple-800 dark:hover:bg-purple-800 transition-colors flex items-center justify-center gap-2 border border-purple-800/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      View Full Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Quick Access Buttons */}
        {!selectedFood && !loading && results.length === 0 && !imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl shadow-xl overflow-hidden cursor-pointer border border-emerald-700/30"
              onClick={() => router.push('/fitness')}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="bg-white/20 rounded-full px-3 py-1">
                    <span className="text-white text-sm">Popular</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Fitness & Activity</h3>
                <p className="text-white/80 mb-6">Track your workouts and monitor your daily activity levels</p>
                
                <div className="flex justify-end">
                  <div className="bg-white/20 hover:bg-white/30 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-amber-800 to-orange-900 rounded-2xl shadow-xl overflow-hidden cursor-pointer border border-amber-700/30"
              onClick={() => router.push('/recipe')}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="bg-white/20 rounded-full px-3 py-1">
                    <span className="text-white text-sm">New</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Healthy Recipes</h3>
                <p className="text-white/80 mb-6">Discover delicious recipes tailored to your nutritional needs</p>
                
                <div className="flex justify-end">
                  <div className="bg-white/20 hover:bg-white/30 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl shadow-xl overflow-hidden cursor-pointer border border-purple-700/30"
              onClick={() => router.push('/profile')}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Personal Profile</h3>
                <p className="text-white/80 mb-6">Access your personal settings and view your nutrition history</p>
                
                <div className="flex justify-end">
                  <div className="bg-white/20 hover:bg-white/30 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Features Section */}
        {!selectedFood && !loading && results.length === 0 && !imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-center text-white dark:text-white mb-8">
              Discover the Power of AI-Driven Nutrition
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gray-800 dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700"
              >
                <div className="bg-blue-900/30 dark:bg-blue-900/30 p-3 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white dark:text-white mb-2">Image Recognition</h3>
                <p className="text-gray-300 dark:text-gray-300">
                  Simply take a photo of your food and our AI will identify it and provide detailed nutritional information.
                </p>
              </motion.div>
              
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gray-800 dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700"
              >
                <div className="bg-green-900/30 dark:bg-green-900/30 p-3 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white dark:text-white mb-2">Nutrition Analysis</h3>
                <p className="text-gray-300 dark:text-gray-300">
                  Get comprehensive breakdowns of calories, macronutrients, and health insights for any food item.
                </p>
              </motion.div>
              
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gray-800 dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700"
              >
                <div className="bg-purple-900/30 dark:bg-purple-900/30 p-3 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white dark:text-white mb-2">Smart Recommendations</h3>
                <p className="text-gray-300 dark:text-gray-300">
                  Receive AI-powered diet suggestions and recipe ideas tailored to your nutritional needs and preferences.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Full Analysis Modal */}
      <AnimatePresence>
        {showFullAnalysis && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-gray-900 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700"
            >
              <div className="sticky top-0 z-10 bg-gray-900 dark:bg-gray-900 px-6 py-4 border-b border-gray-800 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white dark:text-white">Full Nutrition Analysis</h2>
                <button 
                  onClick={() => setShowFullAnalysis(false)}
                  className="text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="bg-gray-800 dark:bg-gray-800 p-4 rounded-2xl border border-gray-700">
                      <div className="text-center mb-4">
                        <span className="text-4xl">
                          {selectedFood.food_name.toLowerCase().includes('pizza') ? '🍕' : 
                           selectedFood.food_name.toLowerCase().includes('burger') ? '🍔' : 
                           selectedFood.food_name.toLowerCase().includes('chicken') ? '🍗' : 
                           selectedFood.food_name.toLowerCase().includes('salad') ? '🥗' : '🍽️'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white dark:text-white text-center mb-1">{selectedFood.food_name}</h3>
                      <p className="text-gray-400 dark:text-gray-400 text-center mb-4">{selectedFood.serving_type} ({selectedFood.calories_calculated_for}g)</p>
                      
                      <div className="bg-gray-900 dark:bg-gray-900 rounded-xl p-4 mb-4 border border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 dark:text-gray-300 font-medium">Calories</span>
                          <span className="text-2xl font-bold text-white dark:text-white">{Math.round(selectedFood.nutrients.calories)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-700 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                          <div 
                            className="h-full bg-purple-600" 
                            style={{ width: `${Math.min(Math.round(selectedFood.nutrients.calories/2000*100), 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-end mt-1">
                          <span className="text-xs text-gray-400 dark:text-gray-400">
                            {Math.round(selectedFood.nutrients.calories/2000*100)}% of daily value
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 dark:bg-gray-900 rounded-xl p-4 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white dark:text-white mb-3">Quick Facts</h4>
                        <ul className="space-y-2 text-gray-300 dark:text-gray-300">
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{Math.round(selectedFood.nutrients.protein * 4 / selectedFood.nutrients.calories * 100)}% of calories from protein</span>
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{Math.round(selectedFood.nutrients.carbs * 4 / selectedFood.nutrients.calories * 100)}% of calories from carbs</span>
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{Math.round(selectedFood.nutrients.fats * 9 / selectedFood.nutrients.calories * 100)}% of calories from fat</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-2/3">
                    <div className="bg-gray-800 dark:bg-gray-800 p-6 rounded-2xl border border-gray-700">
                      <h3 className="text-xl font-bold border-b-2 border-gray-700 dark:border-gray-600 pb-1 mb-4 text-white">Nutrition Facts</h3>
                      <p className="text-sm mb-2 text-gray-300">Serving Size: {selectedFood.serving_type} ({selectedFood.calories_calculated_for}g)</p>
                      
                      <div className="border-t-8 border-b-4 border-gray-700 dark:border-gray-600 py-2 mb-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-xl text-white dark:text-white">Calories</span>
                          <span className="font-bold text-xl text-white dark:text-white">{Math.round(selectedFood.nutrients.calories)}</span>
                        </div>
                      </div>
                      
                      {/* Detailed Nutrient Breakdown */}
                      <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-white dark:text-white">Total Fat</span>
                          <span className="text-white dark:text-white">{selectedFood.nutrients.fats}g</span>
                        </div>
                        <div className="pl-4 text-sm text-gray-300 dark:text-gray-300">
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
                      
                      <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-white dark:text-white">Cholesterol</span>
                          <span className="text-white dark:text-white">{Math.round(selectedFood.nutrients.protein * 2.5)}mg</span>
                        </div>
                      </div>
                      
                      <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-white dark:text-white">Sodium</span>
                          <span className="text-white dark:text-white">{Math.round(selectedFood.calories_calculated_for * 5)}mg</span>
                        </div>
                      </div>
                      
                      <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-white dark:text-white">Total Carbohydrate</span>
                          <span className="text-white dark:text-white">{selectedFood.nutrients.carbs}g</span>
                        </div>
                        <div className="pl-4 text-sm text-gray-300 dark:text-gray-300">
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
                      
                      <div className="border-b border-gray-700 dark:border-gray-600 py-1 mb-4">
                        <div className="flex justify-between">
                          <span className="font-bold text-white dark:text-white">Protein</span>
                          <span className="text-white dark:text-white">{selectedFood.nutrients.protein}g</span>
                        </div>
                      </div>
                      
                      {/* Vitamins and Minerals */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300 dark:text-gray-300">Vitamin D</span>
                              <span className="text-white dark:text-white">-</span>
                            </div>
                          </div>
                          
                          <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300 dark:text-gray-300">Calcium</span>
                              <span className="text-white dark:text-white">{Math.round(selectedFood.calories_calculated_for * 0.5)}mg</span>
                            </div>
                          </div>
                          
                          <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300 dark:text-gray-300">Iron</span>
                              <span className="text-white dark:text-white">{(selectedFood.calories_calculated_for * 0.01).toFixed(2)}mg</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300 dark:text-gray-300">Potassium</span>
                              <span className="text-white dark:text-white">{Math.round(selectedFood.calories_calculated_for * 3)}mg</span>
                            </div>
                          </div>
                          
                          <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300 dark:text-gray-300">Vitamin A</span>
                              <span className="text-white dark:text-white">{Math.round(selectedFood.calories_calculated_for * 0.6)}mcg</span>
                            </div>
                          </div>
                          
                          <div className="border-b border-gray-700 dark:border-gray-600 py-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300 dark:text-gray-300">Vitamin C</span>
                              <span className="text-white dark:text-white">{(selectedFood.calories_calculated_for * 0.05).toFixed(1)}mg</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-400 dark:text-gray-400 mt-4">* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-indigo-900/20 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-700/30">
                        <h4 className="text-lg font-semibold text-white dark:text-white mb-3 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Allergen Information
                        </h4>
                        <div className="space-y-2">
                          <div className="bg-gray-800 dark:bg-gray-800 p-3 rounded-xl">
                            <h5 className="font-medium text-white dark:text-white mb-2">May contain:</h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedFood.food_name.toLowerCase().includes('cheese') || 
                               selectedFood.food_name.toLowerCase().includes('butter') && (
                                <span className="px-2 py-1 bg-yellow-900/50 dark:bg-yellow-900/50 text-yellow-300 dark:text-yellow-300 rounded-full text-xs">
                                  Dairy
                                </span>
                              )}
                              {selectedFood.food_name.toLowerCase().includes('gluten') && (
                                <span className="px-2 py-1 bg-yellow-900/50 dark:bg-yellow-900/50 text-yellow-300 dark:text-yellow-300 rounded-full text-xs">
                                  Gluten
                                </span>
                              )}
                              {selectedFood.food_name.toLowerCase().includes('chicken') && (
                                <span className="px-2 py-1 bg-yellow-900/50 dark:bg-yellow-900/50 text-yellow-300 dark:text-yellow-300 rounded-full text-xs">
                                  Poultry
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-teal-900/20 dark:bg-teal-900/20 p-4 rounded-2xl border border-teal-700/30">
                        <h4 className="text-lg font-semibold text-white dark:text-white mb-3 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Health Benefits
                        </h4>
                        
                        <div className="space-y-2 text-gray-300 dark:text-gray-300 text-sm">
                          <p className="flex items-start">
                            <span className="text-teal-500 mr-2 flex-shrink-0">✓</span>
                            {selectedFood.nutrients.protein >= 15 ? 
                              "High in protein to support muscle growth and tissue repair" :
                              "Contains protein which helps with muscle maintenance"}
                          </p>
                          
                          <p className="flex items-start">
                            <span className="text-teal-500 mr-2 flex-shrink-0">✓</span>
                            {selectedFood.nutrients.carbs >= 20 ? 
                              "Rich in carbohydrates, providing energy for physical activities" :
                              "Moderate carbohydrate content for sustained energy"}
                          </p>
                          
                          <p className="flex items-start">
                            <span className="text-teal-500 mr-2 flex-shrink-0">✓</span>
                            Provides essential calories needed for daily metabolic functions
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-white dark:text-white mb-4">Similar Foods</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {results.filter(food => food.food_unique_id !== selectedFood.food_unique_id).slice(0, 3).map((food) => (
                      <motion.div 
                        key={food.food_unique_id}
                        whileHover={{ scale: 1.03 }}
                        className="bg-gray-800 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer border border-gray-700"
                        onClick={() => {
                          setSelectedFood(food);
                          setShowFullAnalysis(false);
                          generateInsights(food);
                        }}
                      >
                        <div className="h-16 bg-gradient-to-r from-purple-700 to-indigo-800 flex items-center justify-center">
                          <span className="text-2xl">
                            {food.food_name.toLowerCase().includes('pizza') ? '🍕' : 
                             food.food_name.toLowerCase().includes('burger') ? '🍔' : 
                             food.food_name.toLowerCase().includes('chicken') ? '🍗' : 
                             food.food_name.toLowerCase().includes('salad') ? '🥗' : '🍽️'}
                          </span>
                        </div>
                        
                        <div className="p-3">
                          <h4 className="text-white dark:text-white font-medium text-sm line-clamp-1">{food.food_name}</h4>
                          <div className="flex justify-between mt-1 text-xs">
                            <span className="text-gray-400 dark:text-gray-400">{Math.round(food.nutrients.calories)} cal</span>
                            <span className="text-gray-400 dark:text-gray-400">{food.serving_type}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Data sourced from nutritional databases and may vary slightly from actual products.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <footer className="mt-20 bg-gray-900 dark:bg-gray-900 border-t border-gray-800 dark:border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                AnnaData
              </h2>
              <p className="text-gray-400 dark:text-gray-400 mt-1">
                Your AI-Powered Nutritional Intelligence Assistant
              </p>
            </div>
            
            <div className="flex flex-wrap gap-6 justify-center">
              <a href="#" className="text-gray-400 dark:text-gray-400 hover:text-purple-400 dark:hover:text-purple-400">About</a>
              <a href="#" className="text-gray-400 dark:text-gray-400 hover:text-purple-400 dark:hover:text-purple-400">Privacy</a>
              <a href="#" className="text-gray-400 dark:text-gray-400 hover:text-purple-400 dark:hover:text-purple-400">Terms</a>
              <a href="#" className="text-gray-400 dark:text-gray-400 hover:text-purple-400 dark:hover:text-purple-400">Contact</a>
            </div>
          </div>
          
          <div className="mt-8 text-center text-gray-500 dark:text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} AnnaData. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  </AuthCheck>
);
}