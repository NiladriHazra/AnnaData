// pages/api/profile/updateAchievements.js
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
    
    // Get the achievement ID from request body
    const { achievementId, achieved } = req.body;
    
    if (!achievementId) {
      return res.status(400).json({ message: 'Achievement ID is required' });
    }
    
    // Update the achievements list
    if (achieved) {
      // Add the achievement if it doesn't exist
      await ProfileData.findOneAndUpdate(
        { userId: user._id, achievements: { $ne: achievementId } },
        { $push: { achievements: achievementId } }
      );
    } else {
      // Remove the achievement
      await ProfileData.findOneAndUpdate(
        { userId: user._id },
        { $pull: { achievements: achievementId } }
      );
    }
    
    return res.status(200).json({ success: true, message: 'Achievements updated successfully' });
    
  } catch (error) {
    console.error("Error updating achievements:", error);
    return res.status(500).json({ success: false, message: 'Failed to update achievements', error: error.message });
  }
}