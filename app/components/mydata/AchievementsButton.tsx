import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AchievementsButtonProps {
  onPress: () => void;
  unlocked: number;
  total: number;
}

export const AchievementsButton: React.FC<AchievementsButtonProps> = ({ 
  onPress, 
  unlocked, 
  total 
}) => {
  const percentComplete = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <LinearGradient
        colors={['#7B1FA2', '#4A148C'] as readonly [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="trophy" size={30} color="#FFD700" />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>Achievements</Text>
            <Text style={styles.subtitle}>
              {unlocked} of {total} unlocked ({percentComplete}%)
            </Text>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(percentComplete, 100)}%` }
                  ]}
                />
              </View>
            </View>
          </View>
          
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color="#FFFFFF" 
            style={styles.chevron}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  subtitle: {
    fontSize: 12,
    color: '#E0E0E0',
    marginBottom: 6,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  chevron: {
    marginLeft: 8,
  },
});

// Add default export for expo-router
export default AchievementsButton; 