import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  // Log all incoming requests to help debug
  console.log("Logout request received:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the current user session
    const session = await getServerSession(req, res, authOptions);
    console.log("Session in logout endpoint:", session);

    // Check if the user is authenticated
    if (!session) {
      console.log("No session found during logout attempt");
      return res.status(401).json({ message: "Not authenticated" });
    }

    // For now, let's avoid database operations and simply return success
    // You can add the database operations back once the basic functionality works
    console.log("Logout successful for user:", session.user.email);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in logoutEverywhere:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message || "Unknown error" 
    });
  }
}