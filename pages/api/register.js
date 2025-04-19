import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../lib/mongodb';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=150`,
      createdAt: new Date(),
      achievements: [], // Default empty achievements
    });

    // Return the user without the password
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    return res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Error creating user', error: error.message });
  }
}