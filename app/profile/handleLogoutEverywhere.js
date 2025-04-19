// Add this function to your profile page component
const handleLogoutEverywhere = async () => {
    try {
      console.log("Attempting to log out from all devices...");
      
      // Call the API endpoint
      const response = await fetch('/api/auth/logoutEverywhere', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Log the raw response for debugging
      console.log("Response status:", response.status);
      
      // Try to parse the response as JSON
      let data;
      try {
        data = await response.json();
        console.log("Response data:", data);
      } catch (e) {
        console.error("Error parsing response:", e);
      }
      
      if (!response.ok) {
        throw new Error(data?.message || `Server returned ${response.status}`);
      }
      
      // Clear localStorage
      localStorage.removeItem("userData");
      localStorage.removeItem("userInsights");
      
      // Display a success message
      alert("You have been logged out of all devices. Please log in again.");
      
      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Error logging out everywhere:", error);
      alert(`Failed to log out: ${error.message}`);
    }
  };