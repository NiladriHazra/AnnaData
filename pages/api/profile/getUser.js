// pages/api/profile/getUser.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import User from '../../../models/User';
import ProfileData from '../../../models/ProfileData'; // We'll create this model

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
    
    // Get the user's basic info from the User model
    const user = await User.findOne({ email: session.user.email }).lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find or create a profile data record for this user
    let profileData = await ProfileData.findOne({ userId: user._id }).lean();
    
    if (!profileData) {
      // If no profile data exists yet, create a default one
      const defaultProfileData = {
        userId: user._id,
        username: user.email.split('@')[0],
        profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=150`,
        bio: `Hello, I'm ${user.name}. Just started my nutrition and fitness journey with AnnaData!`,
        theme: "primary",
        location: "",
        settings: {
          emailNotifications: true,
          pushNotifications: true,
          weeklyReports: true,
          darkMode: true,
          language: "english",
          unitSystem: "metric",
          privacyMode: "friends",
        },
        stats: {
          totalRecipes: 0,
          totalWorkouts: 0,
          daysTracked: 1,
          goalsMet: 0,
          streakDays: 1,
          caloriesBurned: 0,
          nutritionScore: 50,
        },
        achievements: [],
        goals: [],
        healthData: {
          weight: [],
          caloriesConsumed: [],
          caloriesBurned: [],
          macros: [
            { name: "Protein", value: 25 },
            { name: "Carbs", value: 50 },
            { name: "Fat", value: 25 },
          ],
          workoutMinutes: [],
          sleepHours: [],
        },
        socialConnections: {
          friends: 0,
          recipes_shared: 0,
          workouts_shared: 0,
        },
        recentActivity: [],
        savedRecipes: [],
        favoriteWorkouts: [],
        subscriptionTier: "free",
        lastLogin: new Date(),
      };
      
      // Save the default profile data
      const newProfileData = new ProfileData(defaultProfileData);
      await newProfileData.save();
      
      profileData = defaultProfileData;
    }
    
    // Combine user and profile data
    const userData = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      ...profileData,
      userId: undefined, // remove redundant field
    };
    
    // Remove sensitive data
    delete userData.password;
    
    return res.status(200).json(userData);
    
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ message: 'Failed to load user profile', error: error.message });
  }
}