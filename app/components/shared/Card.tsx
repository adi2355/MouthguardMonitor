import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/src/constants';

interface CardProps {
  children: ReactNode;
  style?: any;
}

/**
 * Card component that provides consistent styling for card elements
 * with the green gradient accents shown in the design.
 */
const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['rgba(0,230,118,0.15)', 'rgba(0,230,118,0.05)', 'transparent']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
});

export default Card;