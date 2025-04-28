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
        colors={['rgba(0,230,118,0.10)', 'rgba(0,230,118,0.03)', 'transparent']}
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
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.08)',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
    padding: 20,
    marginVertical: 12,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
});

export default Card;