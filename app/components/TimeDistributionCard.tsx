import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { COLORS } from "@/src/constants";
import { TimeDistribution } from "@/src/types";

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

export default function TimeDistributionCard({ timeData }: TimeDistributionCardProps) {
  const total = Object.values(timeData).reduce((sum, val) => sum + val, 0);

  const TimeSlotComponent = ({ type, value }: { type: TimeSlot; value: number }) => {
    const percentage = total === 0 ? 0 : (value / total) * 100;
    const barWidth = Math.max(0, Math.min(100, percentage)); // Ensure between 0-100

    return (
      <View style={styles.timeSlot}>
        <View style={styles.timeSlotContent}>
          <View style={styles.timeSlotHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={ICONS_MAP[type]} 
                size={18} 
                color={COLORS_MAP[type]} 
              />
            </View>
            <Text style={styles.timeSlotText}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
            <Text style={styles.percentageText}>
              {percentage.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.barContainer}>
            <View 
              style={[
                styles.bar, 
                { 
                  width: `${barWidth}%`,
                  backgroundColor: COLORS_MAP[type] 
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="clock-outline" 
          size={24} 
          color={COLORS.primary}
        />
        <Text style={styles.headerText}>Time Distribution</Text>
      </View>

      <View style={styles.content}>
        <TimeSlotComponent type="morning" value={timeData.morning} />
        <TimeSlotComponent type="afternoon" value={timeData.afternoon} />
        <TimeSlotComponent type="evening" value={timeData.evening} />
        <TimeSlotComponent type="night" value={timeData.night} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 10,
    letterSpacing: 0.38,
  },
  content: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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