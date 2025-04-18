// pages/api/diary/add.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = session.user.id || session.user.email;
    
    // Get data from request body
    const { food, mealType = 'snack', notes = '', date = new Date() } = req.body;
    
    if (!food) {
      return res.status(400).json({ message: 'Food data is required' });
    }
    
    try {
      // Connect to database
      const { db } = await connectToDatabase();
      
      // Save to MongoDB
      const result = await db.collection('food_diary').insertOne({
        userId,
        date: new Date(date),
        mealType,
        food,
        notes,
        createdAt: new Date(),
      });
      
      return res.status(201).json({ 
        message: 'Food added to diary successfully',
        entryId: result.insertedId 
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Database error', error: dbError.message });
    }
    
  } catch (error) {
    console.error('Error saving to food diary:', error);
    return res.status(500).json({ message: 'Error saving food to diary', error: error.message });
  }
}