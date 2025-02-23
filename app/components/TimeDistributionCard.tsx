import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from "@/src/constants";
import { TimeDistribution } from "@/src/types";
import Animated, { FadeIn } from 'react-native-reanimated';

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

  const TimeSlotComponent = ({ type, value }: { type: TimeSlot; value: number }) => {
    const percentage = total === 0 ? 0 : (value / total) * 100;
    const barWidth = Math.max(0, Math.min(100, percentage));

    return (
      <Animated.View 
        entering={FadeIn.delay(type === 'morning' ? 200 : type === 'afternoon' ? 400 : type === 'evening' ? 600 : 800)}
        style={styles.timeSlot}
      >
        <View style={styles.timeSlotContent}>
          <View style={styles.timeSlotHeader}>
            <LinearGradient
              colors={[`${COLORS_MAP[type]}40`, `${COLORS_MAP[type]}20`]}
              style={styles.iconContainer}
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
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      <LinearGradient
        colors={[
          'rgba(0,230,118,0.15)',
          'rgba(0,230,118,0.05)',
          'transparent'
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Time Distribution</Text>
            <Text style={styles.subtitle}>
              Activity patterns throughout the day
            </Text>
          </View>
          
          <LinearGradient
            colors={['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.1)']}
            style={styles.headerIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={24} 
              color={COLORS.primary}
            />
          </LinearGradient>
        </View>

        <View style={styles.distributionContent}>
          <TimeSlotComponent type="morning" value={timeData.morning} />
          <TimeSlotComponent type="afternoon" value={timeData.afternoon} />
          <TimeSlotComponent type="evening" value={timeData.evening} />
          <TimeSlotComponent type="night" value={timeData.night} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'rgba(26, 26, 26, 0.8)',
      android: 'rgba(26, 26, 26, 0.95)',
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    letterSpacing: 0.35,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    letterSpacing: 0.25,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  iconContainer: {
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
});

export default TimeDistributionCard; 