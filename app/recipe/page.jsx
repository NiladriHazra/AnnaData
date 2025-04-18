"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChefHat, Clock, Users, Utensils, Search, Upload, Camera, ArrowLeft, MessageCircle, X } from 'lucide-react';
import Image from 'next/image';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyD2o0V8Kg-T_FQymwvlOyphswEwAxKEQoU");

// Loading component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-16 h-16 relative">
      <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-white/20 rounded-full"></div>
      <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
    <p className="mt-4 text-white/80 text-lg">Searching for recipes...</p>
  </div>
);

export default function RecipePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('query') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Load recipe on initial render if query exists
  useEffect(() => {
    if (initialQuery) {
      searchRecipe(initialQuery);
    }
  }, [initialQuery]);

  // Function to search recipe using Gemini
  const searchRecipe = async (searchQuery) => {
    setLoading(true);
    setError(null);
    
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
      const cleanedText = text.replace(/```json|```/g, '').trim();
      
      try {
        const recipeData = JSON.parse(cleanedText);
        
        // Generate an image description for the recipe
        const imageModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        
        setRecipe(recipeData);
      } catch (jsonError) {
        console.error("Error parsing recipe data:", jsonError);
        setError("Failed to parse recipe data. Please try again.");
      }
    } catch (error) {
      console.error("Error searching for recipe:", error);
      setError("Failed to search for recipe. Please try again.");
    } finally {
      setLoading(false);
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
          const base64Image = reader.result.split(',')[1];
          
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          
          const parts = [
            { text: "What food dish is in this image? Return only the dish name without any explanations." },
            {
              inlineData: {
                mimeType: file.type || "image/jpeg",
                data: base64Image
              }
            }
          ];
          
          const result = await model.generateContent({ contents: [{ role: "user", parts }] });
          const response = await result.response;
          const identifiedFood = response.text().trim();
          
          setQuery(identifiedFood);
          searchRecipe(identifiedFood);
        } catch (error) {
          console.error("Error identifying food:", error);
          setError("Failed to identify food in the image. Please try a text search instead.");
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
    const newMessage = { role: 'user', content: userMessage };
    setChatMessages([...chatMessages, newMessage]);
    setUserMessage('');
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
      setChatMessages([...chatMessages, newMessage, { role: 'assistant', content: text }]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setChatMessages([...chatMessages, newMessage, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="font-bold text-2xl">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                  Recipe Finder
                </span>
              </h1>
            </div>
            
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-indigo-700/50 hover:bg-indigo-700 transition-colors"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Ask Anna AI Cook
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchRecipe(query)}
                    placeholder="Search for any recipe..."
                    className="w-full bg-white/5 border border-white/20 rounded-full py-3 pl-5 pr-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    onClick={() => searchRecipe(query)}
                    className="absolute right-1 top-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-2 hover:opacity-90"
                    disabled={loading}
                  >
                    <Search className="h-5 w-5 text-white" />
                  </button>
                </div>
                
                <button
                  onClick={() => document.getElementById('recipe-image').click()}
                  className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-colors"
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
            <div className="bg-red-500/20 border border-red-500/40 text-white rounded-lg p-4 mb-6">
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {/* Recipe Display */}
        {recipe && !loading && (
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Recipe Header */}
              <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-xl mb-8">
                <div className="h-56 sm:h-72 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 mix-blend-overlay"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    <ChefHat className="h-20 w-20" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{recipe.name}</h1>
                    <p className="text-white/80 line-clamp-2">{recipe.description}</p>
                  </div>
                </div>
                
                <div className="bg-gray-900/40 backdrop-blur-md p-6">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
                      <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                      <span>
                        <span className="font-medium">{recipe.totalTime}</span> min total
                      </span>
                    </div>
                    <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
                      <Users className="h-4 w-4 mr-2 text-indigo-400" />
                      <span>
                        <span className="font-medium">{recipe.servings}</span> servings
                      </span>
                    </div>
                    <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
                      <Utensils className="h-4 w-4 mr-2 text-indigo-400" />
                      <span>
                        <span className="font-medium">{recipe.difficulty}</span> difficulty
                      </span>
                    </div>
                    <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
                      <ChefHat className="h-4 w-4 mr-2 text-indigo-400" />
                      <span>{recipe.cuisine} cuisine</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recipe Content - Two column layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - Ingredients */}
                <div>
                  <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-lg sticky top-20">
                    <h2 className="text-xl font-bold flex items-center mb-4">
                      <Utensils className="mr-2 h-5 w-5 text-indigo-400" />
                      Ingredients
                    </h2>
                    
                    <ul className="space-y-3">
                      {recipe.ingredients.map((ingredient, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="flex items-baseline gap-3 text-white/80"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                          <span>{ingredient}</span>
                        </motion.li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h3 className="text-lg font-semibold mb-2">Nutrition Facts</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/70">Calories:</span>
                          <span className="text-white font-medium">{recipe.nutritionFacts.calories} kcal</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Protein:</span>
                          <span className="text-white font-medium">{recipe.nutritionFacts.protein}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Carbs:</span>
                          <span className="text-white font-medium">{recipe.nutritionFacts.carbs}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Fat:</span>
                          <span className="text-white font-medium">{recipe.nutritionFacts.fat}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Instructions and Tips */}
                <div className="md:col-span-2">
                  <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-lg mb-8">
                    <h2 className="text-xl font-bold flex items-center mb-4">
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
                        >
                          <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-white/90 mt-1">{step}</p>
                          </div>
                          {index < recipe.instructions.length - 1 && (
                            <div className="ml-4 h-8 border-l border-dashed border-white/20"></div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Tips Section */}
                  <div className="bg-indigo-900/40 backdrop-blur-md rounded-xl border border-indigo-500/20 p-6 shadow-lg">
                    <h2 className="text-xl font-bold flex items-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Chef's Tips
                    </h2>
                    
                    <ul className="space-y-3">
                      {recipe.tips.map((tip, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-start gap-3 text-white/90"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{tip}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Anna AI Cook Chat */}
      <AnimatePresence>
        {chatOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-2xl w-full max-w-2xl h-3/4 border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="bg-indigo-900/50 backdrop-blur-lg px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3">
                      <ChefHat className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Anna AI Cook</h3>
                      <p className="text-sm text-white/60">Your personal cooking assistant</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setChatOpen(false)}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mb-4">
                        <ChefHat className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Welcome to Anna AI Cook</h3>
                      <p className="text-white/70 max-w-md">
                        Ask me anything about cooking, recipes, ingredients, or techniques. I'm here to help make your cooking experience delightful!
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
                        {["How do I make this recipe vegetarian?", "What can I substitute for eggs?", "How can I make this spicier?", "What wine pairs with this dish?"].map((question, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              setUserMessage(question);
                              setTimeout(() => sendMessage(), 100);
                            }}
                            className="bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm text-left transition-colors border border-white/10"
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
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-3/4 rounded-2xl px-4 py-3 ${
                              msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-gray-700/50 text-white rounded-tl-none border border-white/10'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </motion.div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-700/50 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                              <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '400ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Chat Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Ask Anna AI Cook..."
                      className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={chatLoading || !userMessage.trim()}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-3 hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Anna AI Cook Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-4 shadow-lg hover:opacity-90 transition-opacity z-40"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      )}
    </main>
  );
}