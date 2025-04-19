import mongoose from 'mongoose';

const ProfileDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  profileImage: String,
  bio: String,
  location: String,
  theme: {
    type: String, 
    default: 'primary',
    enum: ['primary', 'teal', 'amber', 'rose', 'blue']
  },
  settings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: true },
    language: { type: String, default: 'english' },
    unitSystem: { type: String, default: 'metric' },
    privacyMode: { type: String, default: 'friends' },
  },
  stats: {
    totalRecipes: { type: Number, default: 0 },
    totalWorkouts: { type: Number, default: 0 },
    daysTracked: { type: Number, default: 1 },
    goalsMet: { type: Number, default: 0 },
    streakDays: { type: Number, default: 1 },
    caloriesBurned: { type: Number, default: 0 },
    nutritionScore: { type: Number, default: 50 },
  },
  achievements: [Number],
  goals: [{
    id: Number,
    name: String,
    target: String,
    progress: Number,
    startDate: Date,
    endDate: Date,
    type: String,
  }],
  healthData: {
    weight: [{
      date: String,
      value: Number,
    }],
    caloriesConsumed: [{
      date: String,
      value: Number,
    }],
    caloriesBurned: [{
      date: String,
      value: Number,
    }],
    macros: [{
      name: String,
      value: Number,
    }],
    workoutMinutes: [{
      date: String,
      value: Number,
    }],
    sleepHours: [{
      date: String,
      value: Number,
    }],
  },
  socialConnections: {
    friends: { type: Number, default: 0 },
    recipes_shared: { type: Number, default: 0 },
    workouts_shared: { type: Number, default: 0 },
  },
  recentActivity: [{
    id: Number,
    type: String,
    action: String,
    name: String,
    date: Date,
  }],
  savedRecipes: [{
    id: Number,
    name: String,
    image: String,
    type: String,
    saved: Date,
  }],
  favoriteWorkouts: [{
    id: Number,
    name: String,
    duration: Number,
    type: String,
    lastPerformed: Date,
  }],
  subscriptionTier: {
    type: String,
    default: 'free',
    enum: ['free', 'premium', 'pro', 'business']
  },
  subscriptionExpiry: Date,
  lastLogin: Date,
}, 
{
  timestamps: true,
});

export default mongoose.models.ProfileData || mongoose.model('ProfileData', ProfileDataSchema);