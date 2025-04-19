"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChefHat,
  Clock,
  Filter,
  Home as HomeIcon,
  Trash2,
  ArrowLeft,
  ArrowRight,
  X,
  Calendar as CalendarIcon,
  MessageCircle,
  BarChart3,
  Search,
  Utensils,
  Flame,
  Apple,
  Heart,
  Edit2
} from "lucide-react";

// Component for empty state
const EmptyState = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-800/70 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-medium text-white mb-2">No entries found</h3>
    <p className="text-slate-400 max-w-md mx-auto">{message}</p>
  </div>
);

// Component for food diary entry
const DiaryEntry = ({ item, onDelete, onEdit }) => {
  const { food, mealType, date } = item;
  const formattedTime = new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
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
  
  // Get mealType color
  const getMealTypeColor = () => {
    switch(mealType) {
      case 'breakfast': return 'bg-amber-900/40 text-amber-300 border-amber-800/40';
      case 'lunch': return 'bg-blue-900/40 text-blue-300 border-blue-800/40';
      case 'dinner': return 'bg-purple-900/40 text-purple-300 border-purple-800/40';
      case 'snack': return 'bg-emerald-900/40 text-emerald-300 border-emerald-800/40';
      default: return 'bg-slate-900/40 text-slate-300 border-slate-800/40';
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-lg overflow-hidden flex flex-col md:flex-row mb-4 hover:border-indigo-500/30 transition-all"
    >
      <div className="bg-gradient-to-r from-indigo-600/40 to-purple-600/40 p-4 flex items-center justify-center md:w-20">
        <span className="text-3xl">{getFoodEmoji(food.food_name)}</span>
      </div>
      
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-medium text-white">{food.food_name}</h4>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getMealTypeColor()} border`}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </span>
              <span className="text-sm text-slate-400">{formattedTime}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => onEdit(item)}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button 
              onClick={() => onDelete(new Date(date).getTime())}
              className="p-1 rounded-full text-slate-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="px-2 py-1 bg-indigo-900/40 rounded text-xs font-medium text-indigo-200 border border-indigo-500/30">
            {Math.round(food.nutrients.calories)} kcal
          </div>
          <div className="px-2 py-1 bg-blue-900/40 rounded text-xs font-medium text-blue-200 border border-blue-500/30">
            P: {food.nutrients.protein}g
          </div>
          <div className="px-2 py-1 bg-emerald-900/40 rounded text-xs font-medium text-emerald-200 border border-emerald-500/30">
            C: {food.nutrients.carbs}g
          </div>
          <div className="px-2 py-1 bg-amber-900/40 rounded text-xs font-medium text-amber-200 border border-amber-500/30">
            F: {food.nutrients.fats}g
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Food Diary Page Component
export default function FoodDiaryPage() {
  const router = useRouter();
  const [diaryItems, setDiaryItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeMealFilter, setActiveMealFilter] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [editMealType, setEditMealType] = useState('');
  
  // Calculate day names for the week view
  const getDayNames = () => {
    const days = [];
    const today = new Date(selectedDate);
    
    // Start from Sunday of the current week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: new Date(date),
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    
    return days;
  };
  
  // Load diary items
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
  
  // Load diary items on component mount
  useEffect(() => {
    loadDiaryItems();
  }, [loadDiaryItems]);
  
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
  
  // Open edit modal
  const openEditModal = (item) => {
    setItemToEdit(item);
    setEditMealType(item.mealType);
    setEditModalOpen(true);
  };
  
  // Save edited item
  const saveEditedItem = () => {
    if (!itemToEdit || !editMealType) return;
    
    const updatedItems = diaryItems.map(item => {
      if (new Date(item.date).getTime() === new Date(itemToEdit.date).getTime()) {
        return { ...item, mealType: editMealType };
      }
      return item;
    });
    
    setDiaryItems(updatedItems);
    localStorage.setItem('savedFoods', JSON.stringify(updatedItems));
    setEditModalOpen(false);
    setItemToEdit(null);
  };
  
  // Navigate to next/previous day
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
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
                onClick={() => router.push('/')}
                className="p-2 rounded-full hover:bg-slate-800/60 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="font-bold text-xl md:text-2xl">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                  Food Diary
                </span>
              </h1>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => router.push('/recipe')}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Recipes
              </button>
              <button
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-indigo-700/50 hover:bg-indigo-700 transition-colors"
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
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/90 backdrop-blur-lg border-b border-slate-800/60 md:hidden"
          >
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => {
                  router.push('/');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => {
                  router.push('/recipe');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Recipes
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium bg-indigo-700/50 hover:bg-indigo-700 transition-colors"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Food Diary
              </button>
              <button
                onClick={() => {
                  router.push('/');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Ask Anna AI
              </button>
            </div>
          </motion.div>
        )}
      </header>

      <div className="container mx-auto px-4 py-8 pb-20">
        {/* Date selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
              Your Food Log
            </h2>
            
            <div className="flex items-center">
              <button 
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1 text-sm bg-indigo-700/40 text-white rounded-md hover:bg-indigo-700/60 transition-colors mr-2 border border-indigo-600/30"
              >
                Today
              </button>
              <button
                onClick={() => navigateDate(-1)}
                className="p-1 rounded-full hover:bg-slate-800/60 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg mx-2">
                <span className="font-medium">
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <button
                onClick={() => navigateDate(1)}
                className="p-1 rounded-full hover:bg-slate-800/60 transition-colors"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Week view */}
          <div className="grid grid-cols-7 gap-2">
            {getDayNames().map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  day.date.toDateString() === selectedDate.toDateString()
                    ? 'bg-indigo-700/50 border border-indigo-500/50'
                    : day.isToday
                    ? 'bg-slate-800/50 border border-slate-600/50'
                    : 'bg-slate-900/30 border border-slate-700/30 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-sm text-slate-400">{day.name}</span>
                <span className={`text-lg font-medium ${
                  day.date.toDateString() === selectedDate.toDateString() ? 'text-white' : 'text-slate-300'
                }`}>
                  {day.date.getDate()}
                </span>
              </button>
            ))}
          </div>
        </div>
        
                {/* Meal type filters */}
                <div className="flex overflow-x-auto scrollbar-hide mb-6 pb-2">
          <div className="flex space-x-2 min-w-max">
            {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
              <motion.button
                key={mealType}
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveMealFilter(mealType)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  activeMealFilter === mealType 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                    : 'bg-slate-800/70 text-slate-300 border border-slate-700/50'
                }`}
              >
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Daily totals */}
        {getDiaryItemsByDate(selectedDate, activeMealFilter).length > 0 && (
          <div className="bg-gradient-to-br from-slate-900/50 to-black/30 rounded-xl p-5 mb-8 border border-slate-700/50 shadow-lg">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" />
              {activeMealFilter === 'all' ? 'Daily Totals' : `${activeMealFilter.charAt(0).toUpperCase() + activeMealFilter.slice(1)} Totals`}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(calculateTotals(getDiaryItemsByDate(selectedDate, activeMealFilter))).map(([key, value]) => (
                <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs text-slate-400 capitalize">{key}</div>
                    {key === 'calories' && <Flame className="h-4 w-4 text-amber-500" />}
                    {key === 'protein' && <Utensils className="h-4 w-4 text-blue-500" />}
                    {key === 'carbs' && <Apple className="h-4 w-4 text-emerald-500" />}
                    {key === 'fat' && <Heart className="h-4 w-4 text-rose-500" />}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {Math.round(value)}{key === 'calories' ? '' : 'g'}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Progress bars for daily targets */}
            <div className="mt-6 space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm text-slate-300">Calories</div>
                  <div className="text-sm text-slate-300">
                    <span className="text-white font-medium">{Math.round(calculateTotals(getDiaryItemsByDate(selectedDate, activeMealFilter)).calories)}</span>
                    {' '}/{' '}
                    <span>2000 kcal</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-800/70 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                    style={{ width: `${Math.min(Math.round(calculateTotals(getDiaryItemsByDate(selectedDate, activeMealFilter)).calories / 2000 * 100), 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm text-slate-300">Protein</div>
                  <div className="text-sm text-slate-300">
                    <span className="text-white font-medium">{Math.round(calculateTotals(getDiaryItemsByDate(selectedDate, activeMealFilter)).protein)}</span>
                    {' '}/ 80g
                  </div>
                </div>
                <div className="h-2 bg-slate-800/70 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600"
                    style={{ width: `${Math.min(Math.round(calculateTotals(getDiaryItemsByDate(selectedDate, activeMealFilter)).protein / 80 * 100), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Food entries */}
        <div className="space-y-6">
          {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
            // Skip rendering sections that don't match the active filter
            if (activeMealFilter !== 'all' && activeMealFilter !== mealType) return null;
            
            // For "all" filter, only show sections that have items
            if (activeMealFilter === 'all') {
              const mealItems = getDiaryItemsByDate(selectedDate).filter(item => item.mealType === mealType);
              if (mealItems.length === 0) return null;
              
              return (
                <div key={mealType}>
                  <h3 className="text-lg font-medium text-white mb-3 capitalize flex items-center">
                    {mealType === 'breakfast' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 5a1 1 0 012 0v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0v-4H3a1 1 0 110-2h4V5z" clipRule="evenodd" />
                      </svg>
                    )}
                    {mealType === 'lunch' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                      </svg>
                    )}
                    {mealType === 'dinner' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12A6 6 0 0110 4zm0 5a1 1 0 00-1 1v3a1 1 0 002 0v-3a1 1 0 00-1-1z" />
                      </svg>
                    )}
                    {mealType === 'snack' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                    {mealType}
                  </h3>
                  
                  <div className="space-y-3">
                    {mealItems.map((item) => (
                      <DiaryEntry 
                        key={new Date(item.date).getTime()} 
                        item={item} 
                        onDelete={removeDiaryItem} 
                        onEdit={openEditModal}
                      />
                    ))}
                  </div>
                </div>
              );
            } else {
              // For specific meal type filters, show all items for that meal type
              const mealItems = getDiaryItemsByDate(selectedDate, mealType);
              return (
                <div key={mealType}>
                  <div className="space-y-3">
                    {mealItems.length > 0 ? (
                      mealItems.map((item) => (
                        <DiaryEntry 
                          key={new Date(item.date).getTime()} 
                          item={item} 
                          onDelete={removeDiaryItem} 
                          onEdit={openEditModal}
                        />
                      ))
                    ) : (
                      <EmptyState 
                        message={`No ${mealType} entries for this day. Add items by searching for foods and saving them to your diary.`}
                        icon={<CalendarIcon className="h-8 w-8 text-slate-500" />}
                      />
                    )}
                  </div>
                </div>
              );
            }
          })}
          
          {/* Empty state if no entries for any meal type */}
          {getDiaryItemsByDate(selectedDate, activeMealFilter).length === 0 && (
            <EmptyState 
              message="No food entries for this day. Search for foods and add them to your diary to keep track of your nutrition."
              icon={<CalendarIcon className="h-8 w-8 text-slate-500" />}
            />
          )}
        </div>
        
        {/* Add food button */}
        <div className="fixed bottom-6 right-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/recipe')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all text-white flex items-center justify-center"
          >
            <Search className="mr-2 h-5 w-5" />
            Search Foods
          </motion.button>
        </div>
      </div>
      
      {/* Edit meal type modal */}
      <AnimatePresence>
        {editModalOpen && itemToEdit && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Edit Meal Type
              </h3>
              
              <p className="text-slate-300 mb-4">
                Change meal type for <span className="text-white font-medium">{itemToEdit.food.food_name}</span>
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {["breakfast", "lunch", "dinner", "snack"].map((meal) => (
                  <button
                    key={meal}
                    onClick={() => setEditMealType(meal)}
                    className={`p-3 rounded-lg border text-white capitalize transition-all ${
                      editMealType === meal 
                        ? 'bg-indigo-700/60 border-indigo-500/70' 
                        : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800/50 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={saveEditedItem}
                  className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
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