import bcrypt from 'bcryptjs';
import connectToDatabase from '../../lib/mongodb';  // Changed back to default import
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Just establish the connection, no need to destructure anything
    await connectToDatabase();
    const { name, email, password } = req.body;

    // Validate request data
    if (!name || !email || !password) {
      return res.status(422).json({ message: 'Missing required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(422).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id.toString(),  // Convert ObjectId to string
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: 'Something went wrong', 
      error: error.message 
    });
  }
}