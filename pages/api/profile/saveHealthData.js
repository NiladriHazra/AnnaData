// pages/api/profile/saveHealthData.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import User from '../../../models/User';
import ProfileData from '../../../models/ProfileData';

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
    
    // Connect to database
    await connectToDatabase();
    
    // Get the user
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get the health data from request body
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ message: 'Type and data are required' });
    }
    
    // Validate the type
    const validTypes = ['weight', 'caloriesConsumed', 'caloriesBurned', 'macros', 'workoutMinutes', 'sleepHours'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid health data type' });
    }
    
    // Create the update object
    const updateField = `healthData.${type}`;
    let updateOperation;
    
    if (type === 'macros') {
      // Replace macros array entirely
      updateOperation = { $set: { [updateField]: data } };
    } else {
      // For time-series data, add new data point
      updateOperation = { $push: { [updateField]: data } };
    }
    
    // Update the profile data
    await ProfileData.findOneAndUpdate(
      { userId: user._id },
      updateOperation,
      { upsert: true }
    );
    
    // If recording workout minutes or calories burned, update stats as well
    if (type === 'workoutMinutes' || type === 'caloriesBurned') {
      const statsUpdate = {};
      
      if (type === 'caloriesBurned') {
        statsUpdate['stats.caloriesBurned'] = data.value;
      }
      
      if (Object.keys(statsUpdate).length > 0) {
        await ProfileData.findOneAndUpdate(
          { userId: user._id },
          { $inc: statsUpdate }
        );
      }
    }
    
    return res.status(200).json({ success: true, message: 'Health data saved successfully' });
    
  } catch (error) {
    console.error("Error saving health data:", error);
    return res.status(500).json({ success: false, message: 'Failed to save health data', error: error.message });
  }
}