// pages/api/profile/generateInsights.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get user data from the request body
    const { userData } = req.body;
    
    if (!userData) {
      return res.status(400).json({ message: 'User data is required' });
    }
    
    // Use Gemini to generate insights
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      I need you to analyze this fitness and nutrition user data and provide 4 brief, specific insights. Each insight should be 1-2 sentences max.
      
      User Data:
      ${JSON.stringify(userData)}
      
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
      
      return res.status(200).json({ insights: parsedInsights });
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, text);
      return res.status(500).json({ message: 'Failed to process AI insights' });
    }
    
  } catch (error) {
    console.error("Error generating insights:", error);
    return res.status(500).json({ message: 'Failed to generate insights', error: error.message });
  }
}