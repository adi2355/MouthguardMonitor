import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/src/constants';
import { LinearGradient } from 'expo-linear-gradient';

interface ThemeWrapperProps {
  children: ReactNode;
}

/**
 * ThemeWrapper provides consistent styling for all screens
 * with the yellowish background color from the design.
 */
const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(237, 235, 209, 1)', 'rgba(237, 235, 209, 0.8)']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondaryBackground, // Sand color as fallback
    position: 'relative',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default ThemeWrapper; 