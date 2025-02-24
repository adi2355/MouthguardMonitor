import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/src/constants';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = memo(({ title, children }: SectionProps) => (
  <View style={styles.sectionWrapper}>
    <LinearGradient
      colors={['rgba(0,230,118,0.1)', 'transparent']}
      style={styles.sectionDivider}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    />
    <View style={styles.section}>
      <LinearGradient
        colors={['rgba(0,230,118,0.1)', 'rgba(0,230,118,0.02)', 'transparent']}
        style={styles.sectionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  </View>
));

const styles = StyleSheet.create({
  sectionWrapper: {
    marginBottom: 32,
    position: 'relative',
  },
  sectionDivider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  section: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'rgba(26, 26, 26, 0.75)',
      android: 'rgba(26, 26, 26, 0.9)',
    }),
  },
  sectionGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 230, 118, 0.1)',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  sectionContent: {
    padding: 12,
    gap: 12,
  },
});

export default Section; 