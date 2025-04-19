// app/profile/userData.js
import { useState, useEffect, useCallback } from "react";

export function useUserData() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user data from the API
        const response = await fetch('/api/profile/getUser');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load user profile');
        }
        
        const userData = await response.json();
        setUser(userData);
        
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user profile. Please try again later.");
        
        // Try to load from localStorage as fallback
        try {
          const savedUser = localStorage.getItem("userData");
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        } catch (localError) {
          // If localStorage also fails, we're out of options
          console.error("Error loading from localStorage:", localError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUser = useCallback(
    async (updatedData) => {
      try {
        setSaving(true);

        // Call the API to update the user data
        const response = await fetch('/api/profile/updateUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update profile');
        }

        // Update local state
        const newUserData = { ...user, ...updatedData };
        setUser(newUserData);

        // Also update localStorage as cache
        localStorage.setItem("userData", JSON.stringify(newUserData));

        return { success: true };
      } catch (err) {
        console.error("Error updating user data:", err);
        setError("Failed to update profile. Please try again.");
        return { success: false, error: err.message };
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  const updateAchievement = useCallback(
    async (achievementId, achieved) => {
      try {
        // Call the API to update the achievement
        const response = await fetch('/api/profile/updateAchievements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ achievementId, achieved }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update achievement');
        }

        // Update local state
        if (user) {
          let newAchievements = [...(user.achievements || [])];
          
          if (achieved && !newAchievements.includes(achievementId)) {
            newAchievements.push(achievementId);
          } else if (!achieved) {
            newAchievements = newAchievements.filter(id => id !== achievementId);
          }
          
          const newUserData = { 
            ...user, 
            achievements: newAchievements 
          };
          
          setUser(newUserData);
          
          // Update localStorage
          localStorage.setItem("userData", JSON.stringify(newUserData));
        }

        return { success: true };
      } catch (err) {
        console.error("Error updating achievement:", err);
        return { success: false, error: err.message };
      }
    },
    [user]
  );

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFormattedCreationDate = () => {
    if (!user?.createdAt) return "";
    return formatDate(user.createdAt);
  };

  const calculateMembershipDuration = () => {
    if (!user?.createdAt) return "";

    const createdDate = new Date(user.createdAt);
    const now = new Date();

    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);

      if (remainingMonths === 0) {
        return `${years} ${years === 1 ? "year" : "years"}`;
      } else {
        return `${years} ${
          years === 1 ? "year" : "years"
        }, ${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
      }
    }
  };

  return {
    user,
    loading,
    error,
    saving,
    updateUser,
    updateAchievement,
    formatDate,
    getFormattedCreationDate,
    calculateMembershipDuration,
  };
}

export default useUserData;