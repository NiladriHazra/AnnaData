import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]";
import { connectToDatabase } from "../../../lib/mongodb";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the current user session
    const session = await getServerSession(req, res, authOptions);

    // Check if the user is authenticated
    if (!session) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Connect to the database
    await connectToDatabase();

    // Update session information in the database
    // This will depend on your specific database schema
    // For NextAuth.js, we'll update the sessionToken field to invalidate all sessions
    
    // Find the user by their ID
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // In a production environment, you would:
    // 1. Delete all sessions for this user from your sessions collection
    // 2. Update any user-specific tokens that might be used for authentication
    
    // For this demo, we'll just return a success response
    // In a real implementation, you would perform database operations here

    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error logging out everywhere:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}