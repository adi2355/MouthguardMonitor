import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { COLORS } from "@/src/constants";
import { LineChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import chartStyles from './ChartStyles';

interface MonthlyOverviewChartProps {
  data: { label: string; value: number }[];
  onPress?: () => void;
}

const windowWidth = Dimensions.get("window").width;

export default function MonthlyOverviewChart({ data, onPress }: MonthlyOverviewChartProps) {
  const chartWidth = useMemo(() => Math.max(windowWidth - 72, 200), [windowWidth]);
  
  const baseChartConfig = useMemo(() => ({
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
    labelColor: () => 'rgba(255, 255, 255, 0.9)',
    strokeWidth: 2,
    useShadowColorFromDataset: false,
    withInnerLines: false,
    withVerticalLines: false,
    withHorizontalLines: true,
    propsForBackgroundLines: {
      stroke: 'rgba(255, 255, 255, 0.1)',
      strokeWidth: 1,
      strokeDasharray: '4',
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.primaryLight,
      fill: COLORS.cardBackground,
    },
    style: {
      borderRadius: 16,
    },
    formatYLabel: (value: string) => Math.round(Number(value)).toString(),
    segments: 4,
  }), []);

  const chartData = useMemo(() => ({
    labels: data.map(d => d.label),
    datasets: [{
      data: data.map(d => d.value),
      color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
      strokeWidth: 2,
    }],
  }), [data]);

  const content = (
    <Card style={chartStyles.card}>
      <View style={chartStyles.header}>
        <View style={chartStyles.headerIcon}>
          <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.primary} />
        </View>
        <View>
          <Text style={chartStyles.headerTitle}>Monthly Overview</Text>
          <Text style={chartStyles.description}>Track your monthly trends</Text>
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
          <LineChart
            data={chartData}
            width={chartWidth}
            height={220}
            chartConfig={baseChartConfig}
            bezier
            withDots={true}
            withShadow={false}
            segments={4}
            fromZero
            withHorizontalLabels={true}
            renderDotContent={({ x, y, index }) => (
              <Text
                key={index}
                style={styles.dotLabel}
              >
                {chartData.datasets[0].data[index]}
              </Text>
            )}
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

const styles = StyleSheet.create({
  dotLabel: {
    position: 'absolute',
    top: -24,
    left: -14,
    fontSize: 12,
    color: COLORS.text.primary,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
}); 