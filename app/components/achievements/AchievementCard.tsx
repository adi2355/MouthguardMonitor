import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAchievementWithDetails } from '../../../src/types';

interface AchievementCardProps {
  achievement: UserAchievementWithDetails;
  onPress: (achievement: UserAchievementWithDetails) => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onPress }) => {
  const { name, category, progress, isUnlocked, icon } = achievement;
  
  // Define styles based on locked/unlocked state
  const cardOpacity = isUnlocked ? 1 : 0.6;
  const iconColor = isUnlocked ? '#00C853' : '#757575';
  const gradientColors = isUnlocked 
    ? ['#43A047', '#2E7D32'] as readonly [string, string]
    : ['#616161', '#424242'] as readonly [string, string];
  
  return (
    <TouchableOpacity 
      style={[styles.container, { opacity: cardOpacity }]} 
      onPress={() => onPress(achievement)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={icon as any || 'trophy'} 
              size={28} 
              color={iconColor} 
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.category}>{category}</Text>
            
            {!isUnlocked && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, progress)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            )}
          </View>
          
          {isUnlocked && (
            <View style={styles.completedBadge}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    borderRadius: 12,
    marginVertical: 6,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#424242',
    borderRadius: 2,
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#E0E0E0',
    minWidth: 32,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 