import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants';
import Animated, { FadeIn } from 'react-native-reanimated';

interface AIRecommendationCardProps {
  onPress: () => void;
}

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({ onPress }) => {
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
              name="brain" 
              size={20} 
              color={COLORS.primary}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>AI Recommendations</Text>
            <Text style={styles.subtitle}>
              Personalized strain suggestions
            </Text>
          </View>
        </View>

        {/* Card description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            Get personalized strain recommendations and insights based on your usage patterns
          </Text>
        </View>

        {/* View Button */}
        <TouchableOpacity 
          onPress={onPress}
          style={styles.viewDetailsButton}
        >
          <Text style={styles.viewDetailsText}>Explore Recommendations</Text>
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={16} 
            color="#000000"
          />
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
  descriptionContainer: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
});

export default AIRecommendationCard;