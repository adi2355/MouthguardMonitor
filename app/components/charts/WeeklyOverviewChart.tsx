import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { COLORS } from "@/src/constants";
import { LinearGradient } from "expo-linear-gradient";
import chartStyles from './ChartStyles';
import BarChart from './BarChart';

interface WeeklyOverviewChartProps {
  data: { label: string; value: number }[];
  onPress?: () => void;
}

export default function WeeklyOverviewChart({ data, onPress }: WeeklyOverviewChartProps) {
  const chartData = data.map(d => d.value);
  const chartLabels = data.map(d => d.label);

  const content = (
    <Card style={chartStyles.card}>
      <View style={chartStyles.header}>
        <View style={chartStyles.headerIcon}>
          <MaterialCommunityIcons name="calendar-week" size={20} color={COLORS.primary} />
        </View>
        <View>
          <Text style={chartStyles.headerTitle}>Weekly Overview</Text>
          <Text style={chartStyles.description}>Compare your usage across different days</Text>
        </View>
      </View>

      <View style={chartStyles.chartWrapper}>
        <View style={chartStyles.chartContainer}>
          <LinearGradient
            colors={['rgba(0,230,118,0.12)', 'rgba(0,230,118,0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <BarChart 
            data={chartData}
            labels={chartLabels}
            barColor={COLORS.primary}
          />
        </View>
      </View>
    </Card>
  );

  return onPress ? (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      {content}
    </TouchableOpacity>
  ) : content;
} 