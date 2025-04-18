import mongoose from 'mongoose';

const FoodDiarySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  food: {
    food_name: { type: String, required: true },
    serving_type: { type: String },
    calories_calculated_for: { type: Number },
    nutrients: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fats: { type: Number }
    }
  },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.models.FoodDiary || mongoose.model('FoodDiary', FoodDiarySchema);