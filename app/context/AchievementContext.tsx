import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { databaseManager } from '../../src/DatabaseManager';
import { UserAchievementWithDetails } from '../../src/types/achievements';
import { DatabaseResponse } from '../../src/types';

interface AchievementContextType {
  achievements: UserAchievementWithDetails[];
  stats: {
    total: number;
    unlocked: number;
    percentComplete: number;
  };
  newlyUnlocked: UserAchievementWithDetails | null;
  loading: boolean;
  loadAchievements: () => Promise<void>;
  checkAchievements: (actionType: string, data: any) => Promise<void>;
  clearNewlyUnlocked: () => void;
}

const defaultContext: AchievementContextType = {
  achievements: [],
  stats: {
    total: 0,
    unlocked: 0,
    percentComplete: 0
  },
  newlyUnlocked: null,
  loading: false,
  loadAchievements: async () => {},
  checkAchievements: async () => {},
  clearNewlyUnlocked: () => {},
};

export const AchievementContext = createContext<AchievementContextType>(defaultContext);

export const useAchievements = () => useContext(AchievementContext);

interface AchievementProviderProps {
  children: ReactNode;
}

export const AchievementProvider: React.FC<AchievementProviderProps> = ({ children }) => {
  const [achievements, setAchievements] = useState<UserAchievementWithDetails[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<UserAchievementWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    percentComplete: 0
  });
  
  // In a real app, you'd get this from authentication context or similar
  const userId = 'current-user';
  
  const loadAchievements = async () => {
    try {
      setLoading(true);
      
      // Fetch achievements - note that getUserAchievements returns an array directly, not a DatabaseResponse
      const userAchievements = await databaseManager.getUserAchievements(userId);
      
      if (userAchievements && Array.isArray(userAchievements)) {
        setAchievements(userAchievements);
        
        // Calculate stats
        const totalCount = userAchievements.length;
        const unlockedCount = userAchievements.filter(a => a.isUnlocked).length;
        
        setStats({
          total: totalCount,
          unlocked: unlockedCount,
          percentComplete: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0
        });
        
        // Clear new flags
        await databaseManager.clearAchievementNewFlags(userId);
        console.log(`[AchievementContext] Loaded ${userAchievements.length} achievements`);
      } else {
        console.error('Failed to load achievements: Invalid response format');
        setAchievements([]);
        setStats({
          total: 0,
          unlocked: 0,
          percentComplete: 0
        });
      }
    } catch (error) {
      console.error('Failed to load achievements:', error instanceof Error ? error.message : 'Unknown error');
      setAchievements([]);
      setStats({
        total: 0,
        unlocked: 0,
        percentComplete: 0
      });
    } finally {
      setLoading(false);
    }
  };
  
  const checkAchievements = async (actionType: string, data: any) => {
    try {
      // Check for newly unlocked achievements based on the action
      const unlockedAchievements = await databaseManager.checkAchievements(userId, actionType, data);
      
      if (unlockedAchievements && Array.isArray(unlockedAchievements) && unlockedAchievements.length > 0) {
        // Set the most recent achievement as newly unlocked for notification
        setNewlyUnlocked(unlockedAchievements[0]);
        
        // Refresh the achievements list to reflect changes
        loadAchievements();
      }
    } catch (error) {
      console.error('Failed to check achievements:', error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  const clearNewlyUnlocked = () => {
    setNewlyUnlocked(null);
  };
  
  // Load achievements on initial mount
  useEffect(() => {
    loadAchievements();
  }, []);
  
  const value = {
    achievements,
    stats,
    newlyUnlocked,
    loading,
    loadAchievements,
    checkAchievements,
    clearNewlyUnlocked,
  };
  
  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}; 