// This file should be in the pages/api directory for Next.js Pages Router
export default function handler(req, res) {
    if (req.method === 'POST') {
      try {
        // Simple implementation - in a real app you would invalidate sessions in your database
        console.log("Logout everywhere endpoint called");
        
        // Send a successful response
        return res.status(200).json({ 
          success: true, 
          message: "Successfully logged out from all devices" 
        });
      } catch (error) {
        console.error("Server error during logout everywhere:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Server error during logout" 
        });
      }
    } else {
      // Method not allowed
      return res.status(405).json({ message: 'Method not allowed' });
    }
  }