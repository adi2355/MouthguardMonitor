import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { COLORS } from "@/src/constants";
import { ChartDataPoint } from "@/src/types";

interface WeeklyUsageBannerProps {
  weeklyData: ChartDataPoint[];
  average: number;
  onPress: () => void;
}

const TREND_COLORS = {
  increase: '#FF5252', // Red for increase
  decrease: '#00E676', // Green for decrease
};

export default function WeeklyUsageBanner({ weeklyData, average, onPress }: WeeklyUsageBannerProps) {
  const total = weeklyData.reduce((sum, point) => sum + point.value, 0);
  const weeklyAverage = total / 7;
  const percentageChange = average > 0 ? ((weeklyAverage - average) / average) * 100 : 0;
  const isIncrease = percentageChange > 0;

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="calendar-week" 
            size={24} 
            color={COLORS.primary}
          />
          <Text style={styles.headerText}>Weekly Usage</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.statRow}>
            <Text style={styles.label}>Total Hits</Text>
            <Text style={styles.value}>{total}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.label}>Weekly Average</Text>
            <Text style={styles.value}>{weeklyAverage.toFixed(1)}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.label}>Change</Text>
            <View style={styles.changeContainer}>
              <MaterialCommunityIcons 
                name={isIncrease ? "arrow-up" : "arrow-down"} 
                size={20} 
                color={isIncrease ? TREND_COLORS.increase : TREND_COLORS.decrease} 
              />
              <Text style={[
                styles.changeValue,
                { color: isIncrease ? TREND_COLORS.increase : TREND_COLORS.decrease }
              ]}>
                {Math.abs(percentageChange).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  content: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
}); 