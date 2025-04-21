import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get the session
      const session = await getServerSession(req, res, authOptions);
      
      if (!session) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Set cookies to expire
      res.setHeader('Set-Cookie', [
        'next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax',
        'next-auth.csrf-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax',
        'next-auth.callback-url=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax'
      ]);

      // Return success
      return res.status(200).json({ success: true, message: "Successfully logged out from all devices" });
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