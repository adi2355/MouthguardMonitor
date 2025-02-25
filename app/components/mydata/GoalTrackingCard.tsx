import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants';
import Animated, { FadeIn } from 'react-native-reanimated';

interface GoalTrackingCardProps {
  currentUsage: number;
  goalUsage: number;
  onEditGoal: () => void;
}

const GoalTrackingCard = ({ currentUsage, goalUsage, onEditGoal }: GoalTrackingCardProps) => {
  // Calculate percentage of goal reached
  const goalPercentage = Math.min(Math.round((currentUsage / goalUsage) * 100), 100);
  const isExceeded = currentUsage > goalUsage;

  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header with icon */}
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons 
              name="target" 
              size={20} 
              color={COLORS.primary} 
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Daily Goal Tracking</Text>
            <Text style={styles.subtitle}>
              {isExceeded ? 'Goal exceeded today' : `${goalPercentage}% of daily goal reached`}
            </Text>
          </View>
          <TouchableOpacity onPress={onEditGoal} style={styles.closeButton}>
            <MaterialCommunityIcons 
              name="pencil" 
              size={16} 
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Container */}
        <View style={styles.statsContainer}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(goalPercentage, 100)}%`,
                    backgroundColor: isExceeded ? '#FF5252' : COLORS.primary
                  }
                ]} 
              />
            </View>
          </View>
          
          {/* Labels */}
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>{currentUsage.toFixed(2)} hits</Text>
            <Text style={styles.goalText}>Goal: {goalUsage} hits</Text>
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity 
          onPress={onEditGoal}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit Goal</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0C140E',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    marginBottom: 12,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  statsContainer: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  goalText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  editButton: {
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
});

export default GoalTrackingCard;