import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Initialize the Generative AI model with updated model name
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create parts with text prompt and image
    const parts = [
      { text: "What food is in this image? Return only the food name without any additional text." },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      }
    ];

    // Generate content
    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const response = await result.response;
    const foodName = response.text();

    res.status(200).json({ foodName });
  } catch (error) {
    console.error('Error recognizing food:', error);
    res.status(500).json({ message: 'Error recognizing food', error: error.message });
  }
}