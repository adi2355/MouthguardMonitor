import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/src/constants';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = memo(({ title, children }: SectionProps) => {
  // Enhanced gradient combinations with type assertions
  const gradientBase = ['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.08)', 'transparent'] as const;
  const accentGradient = ['rgba(0,230,118,0.3)', 'rgba(0,230,118,0.15)'] as const;

  return (
    <Animated.View 
      entering={FadeInDown.springify()}
      layout={Layout.springify()}
      style={styles.container}
    >
      {/* Enhanced Background Gradient */}
      <LinearGradient
        colors={gradientBase}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Shimmer Effect Layer */}
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent'] as const}
        style={styles.shimmerEffect}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        {/* Section Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={accentGradient}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.iconText}>{title.charAt(0)}</Text>
            </LinearGradient>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>
        </View>

        {/* Section Content */}
        <View style={styles.sectionContent}>
          {children}
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  shimmerEffect: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  titleContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
  },
});

export default Section;