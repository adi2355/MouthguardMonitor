export interface Achievement {
  id: number;
  category: string;
  name: string;
  unlockCondition: string;
  notes: string;
  icon: string; // MaterialCommunityIcons name
  complexity: number; // For achievement difficulty/value
}

export interface UserAchievement {
  userId: string;
  achievementId: number;
  progress: number; // 0-100%
  dateUnlocked: string | null;
  isUnlocked: boolean;
  isNew: boolean; // For notifications
  progressData?: any; // JSON data for specific tracking
}

// Extended UserAchievement with achievement details for UI
export interface UserAchievementWithDetails extends UserAchievement {
  id: number;
  category: string;
  name: string;
  unlockCondition: string;
  notes: string;
  icon: string;
  complexity: number;
} 