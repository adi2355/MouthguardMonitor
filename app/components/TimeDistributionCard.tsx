import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from "../../src/constants";
import { TimeDistribution } from "../../src/types";
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface TimeDistributionCardProps {
  timeData: TimeDistribution;
}

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

const COLORS_MAP: Record<TimeSlot, string> = {
  morning: '#FFB74D',
  afternoon: '#4FC3F7',
  evening: '#7986CB',
  night: '#9575CD',
};

const ICONS_MAP: Record<TimeSlot, keyof typeof MaterialCommunityIcons.glyphMap> = {
  morning: 'weather-sunny',
  afternoon: 'weather-partly-cloudy',
  evening: 'weather-sunset',
  night: 'weather-night',
};

const TimeDistributionCard = ({ timeData }: TimeDistributionCardProps) => {
  const total = Object.values(timeData).reduce((sum, val) => sum + val, 0);
  
  // Enhanced gradient combinations with type assertions
  const gradientBase = ['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.08)', 'transparent'] as const;
  const accentGradient = ['rgba(0,230,118,0.3)', 'rgba(0,230,118,0.15)'] as const;

  const TimeSlotComponent = ({ type, value }: { type: TimeSlot; value: number }) => {
    const percentage = total === 0 ? 0 : (value / total) * 100;
    const barWidth = Math.max(0, Math.min(100, percentage));

    return (
      <Animated.View 
        entering={FadeInDown.delay(type === 'morning' ? 200 : type === 'afternoon' ? 400 : type === 'evening' ? 600 : 800).springify()}
        style={styles.timeSlot}
      >
        <View style={styles.timeSlotContent}>
          <View style={styles.timeSlotHeader}>
            <LinearGradient
              colors={[`${COLORS_MAP[type]}40`, `${COLORS_MAP[type]}20`]}
              style={styles.timeSlotIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name={ICONS_MAP[type]} 
                size={18} 
                color={COLORS_MAP[type]} 
              />
            </LinearGradient>
            <Text style={styles.timeSlotText}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
            <Text style={styles.percentageText}>
              {percentage.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.barContainer}>
            <LinearGradient
              colors={[`${COLORS_MAP[type]}`, `${COLORS_MAP[type]}80`]}
              style={[styles.bar, { width: `${barWidth}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      </Animated.View>
    );
  };

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
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={accentGradient}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name="clock-outline" 
                size={22} 
                color={COLORS.primary}
              />
            </LinearGradient>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Time Distribution</Text>
              <Text style={styles.subtitle}>
                Activity patterns throughout the day
              </Text>
            </View>
          </View>
        </View>
        
        {/* Stats Container - Using same styled container but with custom content */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const}
            style={styles.statsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.distributionContent}>
              <TimeSlotComponent type="morning" value={timeData.morning} />
              <TimeSlotComponent type="afternoon" value={timeData.afternoon} />
              <TimeSlotComponent type="evening" value={timeData.evening} />
              <TimeSlotComponent type="night" value={timeData.night} />
            </View>
          </LinearGradient>
        </View>
        
        {/* Message Box */}
        <View style={styles.messageContainer}>
          <LinearGradient
            colors={accentGradient}
            style={styles.statusIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons
              name="chart-timeline-variant"
              size={24}
              color={COLORS.primary}
            />
          </LinearGradient>

          <Text style={styles.messageText}>
            Your usage is primarily during the {
              Object.entries(timeData)
                .sort((a, b) => b[1] - a[1])[0][0]
            } hours, making up {
              Math.floor((Math.max(...Object.values(timeData)) / total) * 100)
            }% of your total consumption
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
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
    marginBottom: 20,
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
  titleContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  statsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  statsGradient: {
    padding: 16,
  },
  distributionContent: {
    gap: 16,
  },
  timeSlot: {
    marginBottom: 4,
  },
  timeSlotContent: {
    gap: 8,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSlotIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeSlotText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    marginLeft: 12,
    letterSpacing: -0.24,
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    width: 40,
    textAlign: 'right',
    letterSpacing: -0.24,
  },
  barContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 12,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
});

export default TimeDistributionCard;