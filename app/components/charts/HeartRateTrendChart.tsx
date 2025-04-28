import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { COLORS } from '@/src/constants';
import { ChartData } from '@/src/types';
import LineChart from './LineChart';
import chartStyles from './ChartStyles';

interface HeartRateTrendChartProps {
  data: ChartData | null;
  avgHr?: number | null;
  minHr?: number | null;
  maxHr?: number | null;
  height?: number;
  width?: number;
}

const HeartRateTrendChart: React.FC<HeartRateTrendChartProps> = ({
  data,
  avgHr,
  minHr,
  maxHr,
  height = 180,
  width = Dimensions.get('window').width - 64,
}) => {
  // Animation value for chart fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Start animation when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Check if we have valid data to display
  if (!data || !data.datasets || !Array.isArray(data.datasets) || data.datasets.length === 0) {
    return (
      <View style={[styles.container, { height, width }]}>
        <Text style={styles.emptyText}>No heart rate data available</Text>
      </View>
    );
  }

  // Create a safe version of the data
  const safeData = {
    labels: Array.isArray(data.labels) ? data.labels : [],
    datasets: data.datasets.map(dataset => {
      if (!dataset) return {
        data: [],
        color: (opacity = 1) => `rgba(255, 69, 58, ${opacity * 0.8})`, // Apple Red with transparency
        strokeWidth: 2
      };
      
      return {
        data: Array.isArray(dataset.data) ? dataset.data : [],
        color: typeof dataset.color === 'function' ? dataset.color : 
          (opacity = 1) => `rgba(255, 69, 58, ${opacity * 0.8})`, // Apple Red with transparency
        strokeWidth: typeof dataset.strokeWidth === 'number' ? dataset.strokeWidth : 2
      };
    }),
    legend: data.legend
  };

  return (
    <Animated.View style={[
      styles.container,
      { 
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      {/* Stats row with KPIs */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[chartStyles.primaryValue, { color: 'rgba(255, 69, 58, 0.9)' }]}>
            {avgHr !== null && avgHr !== undefined ? avgHr : '--'}
          </Text>
          <Text style={chartStyles.label}>Avg BPM</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={chartStyles.secondaryValue}>
            {minHr !== null && minHr !== undefined ? minHr : '--'}
          </Text>
          <Text style={chartStyles.subLabel}>Min</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={chartStyles.secondaryValue}>
            {maxHr !== null && maxHr !== undefined ? maxHr : '--'}
          </Text>
          <Text style={chartStyles.subLabel}>Max</Text>
        </View>
      </View>

      {/* Chart */}
      <LineChart 
        data={safeData}
        width={width}
        height={height}
        bezier={true}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: COLORS.chartBackground,
          backgroundGradientTo: COLORS.chartBackground,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 69, 58, ${opacity * 0.8})`, // Apple Red with transparency
          labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity * 0.6})`, // More transparent axes text
          style: {
            borderRadius: 18,
          },
          propsForDots: {
            r: "1.5", // Smaller dots
            strokeWidth: "1", 
            stroke: "rgba(255, 69, 58, 0.9)",
          },
          propsForBackgroundLines: {
            strokeDasharray: '6, 6',
            strokeWidth: 0.3,
            stroke: 'rgba(150, 150, 150, 0.2)', // Very subtle axes
          },
        }}
        style={{
          marginVertical: 12,
          borderRadius: 18,
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    padding: 20,
  }
});

export default HeartRateTrendChart; 