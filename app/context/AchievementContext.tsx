import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { DatabaseManager, ACHIEVEMENTS_DB_NAME } from '../../src/DatabaseManager';
import { UserAchievementWithDetails } from '../../src/types';
import { AchievementsRepository } from '../../src/repositories/AchievementsRepository';

// Create an instance of DatabaseManager and AchievementsRepository
const databaseManager = new DatabaseManager();
// We'll initialize the repository with null for now and set it properly in useEffect
let achievementsRepository: AchievementsRepository | null = null;

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
  const [repositoryReady, setRepositoryReady] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    percentComplete: 0
  });
  
  // In a real app, you'd get this from authentication context or similar
  const userId = 'current-user';

  // Initialize the repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        // Initialize the database
        await databaseManager.initialize();
        // Get the database connection
        const db = await databaseManager.getDatabase(ACHIEVEMENTS_DB_NAME);
        // Create the repository
        achievementsRepository = new AchievementsRepository(db);
        setRepositoryReady(true);
      } catch (error) {
        console.error('Failed to initialize achievements repository:', error);
      }
    };

    initRepository();

    // Cleanup function
    return () => {
      // Close database connections when unmounted
      databaseManager.cleanup().catch(err => {
        console.error('Error cleaning up database connections:', err);
      });
    };
  }, []);
  
  const loadAchievements = async () => {
    if (!repositoryReady || !achievementsRepository) {
      console.warn('Achievements repository not ready');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch achievements using the repository
      const userAchievements = await achievementsRepository.getUserAchievements(userId);
      
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
        await achievementsRepository.clearAchievementNewFlags(userId);
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
    if (!repositoryReady || !achievementsRepository) {
      console.warn('Achievements repository not ready');
      return;
    }

    try {
      // Check for newly unlocked achievements based on the action
      const unlockedAchievements = await achievementsRepository.checkAchievements(userId, actionType, data);
      
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
  
  // Load achievements when repository is ready
  useEffect(() => {
    if (repositoryReady) {
      loadAchievements();
    }
  }, [repositoryReady]);
  
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

// Add default export for expo-router
export default AchievementProvider; 