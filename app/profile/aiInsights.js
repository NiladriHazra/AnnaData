// app/profile/aiInsights.js
import { useState, useEffect, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

export function useAIInsights() {
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

      // First try to call our API endpoint
      try {
        const response = await fetch('/api/profile/generateInsights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userData: userDataForPrompt }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setInsights(data.insights);
          
          // Cache the insights for future use
          localStorage.setItem(
            "userInsights",
            JSON.stringify({
              timestamp: new Date().toISOString(),
              insights: data.insights,
            })
          );
          
          return data.insights;
        }
      } catch (apiError) {
        console.error("Error calling insights API:", apiError);
        // Continue with client-side generation if API fails
      }

      // Client-side generation as fallback
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
}

export default useAIInsights;