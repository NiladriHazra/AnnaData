"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import AuthCheck from "@/components/AuthCheck";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Bell,
  ChevronLeft,
  Clock,
  Check,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Award,
  Home as HomeIcon,
  Filter,
  Search,
  X,
  RefreshCw,
  Settings,
  Calendar,
  ArrowLeft,
  User
} from "lucide-react";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ""
);

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  
  // Immediate initialization attempt - helps with the initial load issue
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        if (parsedNotifications && parsedNotifications.length > 0) {
          console.log("Immediate initialization with", parsedNotifications.length, "notifications");
          // Force both states to be set immediately to avoid blank initial screen
          setNotifications(parsedNotifications);
          setFilteredNotifications(parsedNotifications);
        }
      }
    } catch (e) {
      console.error("Failed initial state population:", e);
    }
  }, []);

  // Apply filters to notifications (improved function)
  const applyFilters = (notifs, category, date, search) => {
    // Check if we have notifications to filter
    if (!notifs || notifs.length === 0) {
      return [];
    }
    
    let filtered = [...notifs];
    
    // Filter by category - make sure we handle "all" correctly
    if (category !== "all") {
      filtered = filtered.filter(n => n.category === category);
    }
    // For "all" category, we keep all notifications (no filtering)
    
    // Filter by date
    if (date !== "all") {
      const now = new Date();
      
      if (date === "today") {
        filtered = filtered.filter(n => {
          const notifDate = new Date(n.timestamp);
          return notifDate.toDateString() === now.toDateString();
        });
      } else if (date === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(n => new Date(n.timestamp) > weekAgo);
      }
    }
    
    // Filter by search query
    if (search && search.trim() !== "") {
      const query = search.toLowerCase();
      filtered = filtered.filter(n => 
        n.message?.toLowerCase().includes(query) || 
        n.category?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Load notifications from localStorage on mount - improved version with async pattern
  useEffect(() => {
    const loadNotificationsData = async () => {
      try {
        setLoading(true);
        const savedNotifications = localStorage.getItem('notifications');
        
        if (savedNotifications) {
          // Parse the notifications
          const parsedNotifications = JSON.parse(savedNotifications);
          console.log("Loaded notifications:", parsedNotifications.length);
          
          // Set both state variables in a synchronized way
          setNotifications(parsedNotifications);
          
          // Apply filters synchronously here
          const filtered = applyFilters(parsedNotifications, activeFilter, dateFilter, searchQuery);
          console.log("Initial filtering returned", filtered.length, "items for", activeFilter, "category");
          
          setFilteredNotifications(filtered);
        } else {
          console.log("No saved notifications found, generating new ones");
          await generateNotifications(); // Wait for this to complete
        }
      } catch (e) {
        console.error("Error loading notifications:", e);
        setNotifications([]);
        setFilteredNotifications([]);
      } finally {
        setLoading(false);
        setInitComplete(true);
      }
    };
    
    loadNotificationsData();
  }, []); // Only run on component mount

  // Always make sure filtered notifications reflect the active filter
  // This is a safety mechanism
  useEffect(() => {
    if (!initComplete) return; // Skip until initialization is complete
    
    // Only run this if we have notifications
    if (notifications.length > 0) {
      console.log("Safety filtering - ensuring filtered list reflects current filters");
      const filtered = applyFilters(notifications, activeFilter, dateFilter, searchQuery);
      
      if (filtered.length > 0 || activeFilter !== 'all') {
        setFilteredNotifications(filtered);
      } else if (activeFilter === 'all' && filtered.length === 0) {
        // For 'all' category, if we still have no results but should have, show everything
        console.warn("Forcing display of all notifications as fallback");
        setFilteredNotifications([...notifications]);
      }
    }
  }, [notifications, activeFilter, dateFilter, searchQuery, initComplete]);

  // Generate notifications using Gemini API - improved async version
  const generateNotifications = async () => {
    setIsGenerating(true);
    try {
      // Get user's saved foods from localStorage
      const savedFoods = JSON.parse(localStorage.getItem('savedFoods') || '[]');
      const recentFoods = savedFoods.slice(0, 5).map(item => item.food.food_name);
      
      // Create a prompt for Gemini
      const prompt = `
        Generate 8-10 realistic and diverse nutrition notifications for a user who recently logged these foods:
        ${recentFoods.length ? recentFoods.join(', ') : 'No recent food logs'}
        
        Include a mix of:
        - Health tips based on nutrition
        - Reminders for water intake, meal timing
        - Achievements (e.g., "You've logged 5 days in a row!")
        - Insights about nutritional patterns
        - Daily challenges
        
        Each notification should include:
        1. A personalized message about nutrition or health (keep it under 120 characters)
        2. A priority level (low, medium, high)
        3. A category (tip, reminder, achievement, insight, challenge)
        4. An appropriate emoji for the content
        5. A timestamp within the last 7 days, with more recent timestamps being more common
        
        Return ONLY a valid JSON array with objects having these fields:
        - message: string
        - priority: string
        - category: string
        - icon: emoji representation 
        - timestamp: ISO date string from the past week
        - read: boolean (mix of true and false values)
        
        Make the notifications encouraging, specific, and diverse in content.
      `;
      
      // Call Gemini API
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the text to ensure valid JSON
      const cleanedText = text.replace(/```json|```/g, "").trim();
      
      try {
        // Parse the response
        const generatedNotifications = JSON.parse(cleanedText);
        
        // Add IDs to notifications
        const notificationsWithIds = generatedNotifications.map((notification, index) => ({
          ...notification,
          id: Date.now() + index
        }));
        
        // Important: Update state in a synchronized way
        setNotifications(notificationsWithIds);
        
        // Apply filters immediately to the newly generated notifications
        const filtered = applyFilters(notificationsWithIds, activeFilter, dateFilter, searchQuery);
        console.log("Generated", notificationsWithIds.length, "notifications, filtered to", filtered.length);
        
        if (filtered.length > 0 || activeFilter !== 'all') {
          setFilteredNotifications(filtered);
        } else {
          // If "all" category should show everything
          setFilteredNotifications(notificationsWithIds);
        }
        
        localStorage.setItem('notifications', JSON.stringify(notificationsWithIds));
        return notificationsWithIds;
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError, cleanedText);
        throw parseError;
      }
    } catch (error) {
      console.error("Error generating notifications:", error);
      // Fallback notifications
      const currentDate = new Date(); // Current date for recent timestamps
      const fallbackNotifications = [
        {
          id: Date.now(),
          message: "Remember to log your water intake today!",
          category: "reminder",
          priority: "medium", 
          icon: "💧",
          read: false,
          timestamp: new Date(currentDate.getTime() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          id: Date.now() + 1,
          message: "Try adding more protein to your next meal for better muscle recovery",
          category: "tip",
          priority: "low",
          icon: "💪",
          read: true,
          timestamp: new Date(currentDate.getTime() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        },
        {
          id: Date.now() + 2,
          message: "Congratulations! You've tracked your food for 3 days in a row!",
          category: "achievement",
          priority: "high",
          icon: "🏆",
          read: false,
          timestamp: new Date(currentDate.getTime() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: Date.now() + 3,
          message: "Your calcium intake seems low. Consider adding dairy or leafy greens to your diet.",
          category: "insight",
          priority: "medium",
          icon: "📊",
          read: false,
          timestamp: new Date(currentDate.getTime() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
        },
        {
          id: Date.now() + 4,
          message: "Challenge: Try to eat 5 different colored vegetables today for a variety of nutrients!",
          category: "challenge",
          priority: "medium",
          icon: "🥦",
          read: false,
          timestamp: new Date(currentDate.getTime() - 1000 * 60 * 15).toISOString() // 15 minutes ago
        }
      ];
      
      // Apply filters to fallback notifications too
      setNotifications(fallbackNotifications);
      
      const filtered = applyFilters(fallbackNotifications, activeFilter, dateFilter, searchQuery);
      
      if (filtered.length > 0 || activeFilter !== 'all') {
        setFilteredNotifications(filtered);
      } else {
        // For "all" category, always show all notifications
        setFilteredNotifications(fallbackNotifications);
      }
      
      localStorage.setItem('notifications', JSON.stringify(fallbackNotifications));
      return fallbackNotifications;
    } finally {
      setIsGenerating(false);
    }
  };

  // Mark notification as read
  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
    setFilteredNotifications(applyFilters(updatedNotifications, activeFilter, dateFilter, searchQuery));
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ 
      ...notification, 
      read: true 
    }));
    setNotifications(updatedNotifications);
    setFilteredNotifications(applyFilters(updatedNotifications, activeFilter, dateFilter, searchQuery));
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  // Delete a notification
  const deleteNotification = (id) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    setFilteredNotifications(applyFilters(updatedNotifications, activeFilter, dateFilter, searchQuery));
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setFilteredNotifications([]);
    localStorage.setItem('notifications', JSON.stringify([]));
  };
  
  // Get priority color
  function getPriorityColor(priority) {
    switch(priority?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  }

  // Get category badge style
  function getCategoryBadge(category) {
    switch(category?.toLowerCase()) {
      case 'tip': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'reminder': return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
      case 'achievement': return 'bg-amber-600/20 text-amber-400 border-amber-600/30';
      case 'insight': return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
      case 'challenge': return 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30';
      default: return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
    }
  }

  // Get category icon
  function getCategoryIcon(category) {
    switch(category?.toLowerCase()) {
      case 'tip': return <Info className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      case 'achievement': return <Award className="h-4 w-4" />;
      case 'insight': return <CheckCircle className="h-4 w-4" />;
      case 'challenge': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  }

  // Format time ago from date
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
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
        
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-black/80 via-black/70 to-black/80 border-b border-slate-800/60 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push('/')}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-800/60 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-medium flex items-center gap-2">
                  <Bell className="h-5 w-5 text-indigo-400" />
                  Notifications
                </h1>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Search button (mobile) */}
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="md:hidden p-2 rounded-full hover:bg-slate-800/60"
                >
                  {isSearchOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
                
                {/* Search input (desktop) */}
                <div className="hidden md:flex bg-slate-900/50 border border-slate-700/50 rounded-full px-3 py-1.5">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-400 w-44"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="flex-shrink-0 ml-1"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
                
                {/* Filter button */}
                <div className="relative">
                  <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="p-2 rounded-full hover:bg-slate-800/60 flex items-center gap-1"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                  
                  {/* Filter dropdown */}
                  {showFilterMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-64 bg-slate-900/90 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl py-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-slate-700/50">
                        <h4 className="font-medium text-white text-sm">Filter By Category</h4>
                      </div>
                      {['all', 'tip', 'reminder', 'achievement', 'insight', 'challenge'].map(filter => (
                        <button
                          key={filter}
                          onClick={() => {
                            setActiveFilter(filter);
                            
                            // Force immediate refiltering
                            const currentNotifs = [...notifications];
                            const filtered = applyFilters(currentNotifs, filter, dateFilter, searchQuery);
                            console.log(`Switching to ${filter} - found ${filtered.length} matching items`);
                            setFilteredNotifications(filtered.length > 0 || filter !== 'all' 
                              ? filtered 
                              : currentNotifs); // Fallback for "all" category
                              
                            setShowFilterMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-800/50 text-sm flex items-center ${
                            activeFilter === filter ? 'text-indigo-400' : 'text-slate-300'
                          }`}
                        >
                          {activeFilter === filter && <Check className="w-4 h-4 mr-2" />}
                          <span className="ml-2">
                            {filter === 'all' ? 'All Categories' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </span>
                        </button>
                      ))}
                      
                      <div className="border-t border-slate-700/50 mt-1 pt-1">
                        <div className="px-3 py-2">
                          <h4 className="font-medium text-white text-sm">Filter By Date</h4>
                        </div>
                        {[
                          { id: 'all', label: 'All Time' },
                          { id: 'today', label: 'Today' },
                          { id: 'week', label: 'This Week' },
                        ].map(dateOpt => (
                          <button
                            key={dateOpt.id}
                            onClick={() => {
                              setDateFilter(dateOpt.id);
                              
                              // Force immediate refiltering for date as well
                              const currentNotifs = [...notifications];
                              const filtered = applyFilters(currentNotifs, activeFilter, dateOpt.id, searchQuery);
                              setFilteredNotifications(filtered);
                              
                              setShowFilterMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-800/50 text-sm flex items-center ${
                              dateFilter === dateOpt.id ? 'text-indigo-400' : 'text-slate-300'
                            }`}
                          >
                            {dateFilter === dateOpt.id && <Check className="w-4 h-4 mr-2" />}
                            <span className="ml-2">{dateOpt.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Refresh button */}
                <button 
                  onClick={generateNotifications} 
                  disabled={isGenerating}
                  className={`p-2 rounded-full hover:bg-slate-800/60 ${isGenerating ? 'animate-spin text-indigo-400' : ''}`}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                
                {/* Settings button */}
                <button className="p-2 rounded-full hover:bg-slate-800/60">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile search bar */}
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-800/60 py-2 px-4 md:hidden"
            >
              <div className="flex bg-slate-900/50 border border-slate-700/50 rounded-full px-3 py-2">
                <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-400 w-full"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </header>
        
        <div className="container mx-auto px-4 pt-6 pb-24">
          {/* Stats bar */}
          <div className="bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 mb-6 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="text-sm md:text-base">
                {filteredNotifications.filter(n => !n.read).length > 0 ? (
                  <span>
                    You have <span className="text-indigo-400 font-medium">{filteredNotifications.filter(n => !n.read).length}</span> unread {filteredNotifications.filter(n => !n.read).length === 1 ? 'notification' : 'notifications'}
                  </span>
                ) : (
                  <span>All caught up! No unread notifications.</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={markAllAsRead}
                  disabled={!filteredNotifications.some(n => !n.read)}
                  className={`py-1 px-3 text-xs md:text-sm rounded-full border border-slate-700/50 ${
                    filteredNotifications.some(n => !n.read) 
                      ? 'bg-slate-800/60 text-white hover:bg-slate-700/60'
                      : 'bg-slate-900/40 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Mark all read
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAllNotifications}
                  disabled={filteredNotifications.length === 0}
                  className={`py-1 px-3 text-xs md:text-sm rounded-full border ${
                    filteredNotifications.length > 0
                      ? 'bg-red-900/30 text-red-300 border-red-500/30 hover:bg-red-800/40'
                      : 'bg-slate-900/40 text-slate-500 border-slate-700/50 cursor-not-allowed'
                  }`}
                >
                  Clear all
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Category tabs (desktop) */}
          <div className="hidden md:flex mb-6 gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['all', 'tip', 'reminder', 'achievement', 'insight', 'challenge'].map(category => (
              <motion.button
                key={category}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Update filter state
                  setActiveFilter(category);
                  
                  // Force immediate re-filtering with notifications from state
                  const currentNotifs = [...notifications];
                  const filtered = applyFilters(currentNotifs, category, dateFilter, searchQuery);
                  console.log(`Switching to ${category} - found ${filtered.length} matching items`);
                  
                  if (filtered.length > 0 || category !== 'all') {
                    setFilteredNotifications(filtered);
                  } else if (category === 'all') {
                    // For "all" category, if filtering returns empty but we have notifications,
                    // show everything as fallback
                    setFilteredNotifications(currentNotifs);
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === category
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </motion.button>
            ))}
          </div>
          
          {/* Category chips (mobile) */}
          <div className="flex md:hidden mb-6 overflow-x-auto gap-2 pb-1 no-scrollbar">
            {['all', 'tip', 'reminder', 'achievement', 'insight', 'challenge'].map(category => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Update filter state
                  setActiveFilter(category);
                  
                  // Force immediate re-filtering with notifications from state
                  const currentNotifs = [...notifications];
                  const filtered = applyFilters(currentNotifs, category, dateFilter, searchQuery);
                  console.log(`Mobile: Switching to ${category} - found ${filtered.length} matching items`);
                  
                  if (filtered.length > 0 || category !== 'all') {
                    setFilteredNotifications(filtered);
                  } else if (category === 'all') {
                    // For "all" category, if filtering returns empty but we have notifications,
                    // show everything as fallback
                    setFilteredNotifications(currentNotifs);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                  activeFilter === category
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </motion.button>
            ))}
          </div>
          
          {/* Debug Info (only in development) */}
          {/* {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-slate-900/50 text-xs text-slate-400 rounded-lg">
              <div>Active Filter: {activeFilter}</div>
              <div>Date Filter: {dateFilter}</div>
              <div>Total Notifications: {notifications.length}</div>
              <div>Filtered Notifications: {filteredNotifications.length}</div>
              <div>Search Query: "{searchQuery}"</div>
            </div>
          )} */}
          
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-full border-4 border-slate-700/50 absolute top-0 left-0"></div>
                <div className="w-20 h-20 rounded-full border-4 border-t-indigo-600 border-r-purple-600 border-transparent absolute top-0 left-0 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse"></div>
                </div>
              </div>
              <p className="mt-5 text-xl font-medium bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                Loading notifications...
              </p>
            </div>
          )}
          
          {/* Generating state */}
          {isGenerating && !loading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-slate-900 to-black/90 border border-slate-700/50 rounded-xl p-6 max-w-md text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-700/50 absolute top-0 left-0"></div>
                  <div className="w-16 h-16 rounded-full border-4 border-t-indigo-600 border-r-purple-600 border-transparent absolute top-0 left-0 animate-spin"></div>
                </div>
                <h3 className="text-white font-medium text-lg mb-2">Generating New Notifications</h3>
                <p className="text-slate-400">Our AI is analyzing your food logs to create personalized notifications...</p>
              </div>
            </div>
          )}
          
          {/* Notifications list */}
          {!loading && (
            <>
              {filteredNotifications.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                    <Bell className="w-12 h-12 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No notifications found</h3>
                  <p className="text-slate-400 text-center max-w-md mb-8">
                    {searchQuery ? 
                      `No notifications match your search for "${searchQuery}"` : 
                      activeFilter !== "all" ?
                      `No ${activeFilter} notifications found. Try another category or generate new notifications.` :
                      notifications.length > 0 ?
                      "Something went wrong displaying notifications. Try refreshing the page." :
                      "You don't have any notifications yet."}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generateNotifications}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-white font-medium hover:opacity-90 shadow-lg transition-all flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Notifications
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map(notification => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`bg-gradient-to-br from-slate-900/80 to-black/60 backdrop-blur-lg border rounded-xl overflow-hidden transition-all shadow-lg hover:shadow-xl ${
                        notification.read ? 'border-slate-700/30' : 'border-indigo-500/30'
                      }`}
                    >
                      <div className={`p-4 relative ${notification.read ? 'opacity-80' : 'opacity-100'}`}>
                        {!notification.read && (
                          <span className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full"></span>
                        )}
                        
                        <div className="flex gap-3 items-start">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 flex items-center justify-center text-2xl flex-shrink-0">
                            {notification.icon}
                          </div>
                          
                          <div className="flex-grow">
                            <p className={`mb-2 ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 items-center mt-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${getCategoryBadge(notification.category)} flex items-center gap-1`}>
                                {getCategoryIcon(notification.category)}
                                {notification.category}
                              </span>
                              
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </span>
                              
                              <span className="text-xs text-slate-400 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-3 gap-2">
                          {!notification.read && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => markAsRead(notification.id)}
                              className="px-3 py-1 text-xs rounded-full bg-indigo-900/30 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-800/40"
                            >
                              Mark as read
                            </motion.button>
                          )}
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => deleteNotification(notification.id)}
                            className="px-3 py-1 text-xs rounded-full bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-800/40 flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Bottom navigation bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-black/80 via-black/70 to-black/80 backdrop-blur-xl border-t border-slate-800/60 py-3 px-6 flex justify-around z-40 md:hidden">
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400"
            >
              <HomeIcon className="h-6 w-6 mb-1" />
              <span className="text-xs">Home</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/diary')}
              className="flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400"
            >
              <Calendar className="h-6 w-6 mb-1" />
              <span className="text-xs">Diary</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center text-indigo-400"
            >
              <Bell className="h-6 w-6 mb-1" />
              <span className="text-xs">Notifications</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/profile')}
              className="flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400"
            >
              <User className="h-6 w-6 mb-1" />
              <span className="text-xs">Profile</span>
            </motion.button>
          </div>
        </div>
        
        {/* Back to home floating button (desktop only) */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/')}
          className="fixed bottom-6 right-6 md:flex hidden items-center gap-2 py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-white shadow-lg hover:shadow-xl z-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </motion.button>
      </main>
    </AuthCheck>
  );
}