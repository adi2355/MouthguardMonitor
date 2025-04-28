import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { COLORS } from '@/src/constants';
import { ChartData } from '@/src/types';
import LineChart from './LineChart';
import chartStyles from './ChartStyles';

interface BiteForceDynamicsChartProps {
  data: ChartData;
  avgLeft?: number | null;
  avgRight?: number | null;
  avgTotal?: number | null;
  maxForce?: number | null;
  height?: number;
  width?: number;
}

const BiteForceDynamicsChart: React.FC<BiteForceDynamicsChartProps> = ({
  data,
  avgLeft,
  avgRight,
  avgTotal,
  maxForce,
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

  // More comprehensive check for valid data
  if (!data || !data.datasets || !Array.isArray(data.datasets) || data.datasets.length === 0) {
    return (
      <View style={[styles.container, { height, width }]}>
        <Text style={styles.emptyText}>No bite force data available</Text>
      </View>
    );
  }

  // Ensure that the first dataset has data
  const firstDataset = data.datasets[0];
  if (!firstDataset || !firstDataset.data || !Array.isArray(firstDataset.data) || firstDataset.data.length === 0) {
    return (
      <View style={[styles.container, { height, width }]}>
        <Text style={styles.emptyText}>No bite force data available</Text>
      </View>
    );
  }

  // Create a safe version of the data object with Apple colors
  const safeData = {
    labels: Array.isArray(data.labels) ? data.labels : [],
    datasets: data.datasets.map((dataset, index) => {
      if (!dataset) return {
        data: [],
        color: (opacity = 1) => 'rgba(0, 0, 0, 0)',
        strokeWidth: 0
      };
      
      return {
        data: Array.isArray(dataset.data) ? dataset.data : [],
        color: typeof dataset.color === 'function' ? dataset.color : 
          (opacity = 1) => index === 0 ? 
            `rgba(50, 215, 75, ${opacity * 0.8})` :  // Apple Green with transparency
            `rgba(10, 132, 255, ${opacity * 0.8})`,  // Apple Blue with transparency
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
      {/* KPI metrics row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[chartStyles.primaryValue, { color: 'rgba(50, 215, 75, 0.9)' }]}>
            {avgLeft ?? '--'}
          </Text>
          <Text style={chartStyles.label}>Left Avg</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[chartStyles.primaryValue, { color: 'rgba(10, 132, 255, 0.9)' }]}>
            {avgRight ?? '--'}
          </Text>
          <Text style={chartStyles.label}>Right Avg</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={chartStyles.secondaryValue}>{maxForce ?? '--'}</Text>
          <Text style={chartStyles.subLabel}>Max Force</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(50, 215, 75, 0.9)' }]} />
          <Text style={styles.legendText}>Left</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(10, 132, 255, 0.9)' }]} />
          <Text style={styles.legendText}>Right</Text>
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
          // Color function that will be overridden by dataset colors
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity * 0.6})`,
          style: {
            borderRadius: 18,
          },
          propsForDots: {
            r: "1.5",
            strokeWidth: "1",
          },
          propsForBackgroundLines: {
            strokeDasharray: '6, 6',
            strokeWidth: 0.3,
            stroke: 'rgba(150, 150, 150, 0.2)',
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
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    padding: 20,
  }
});

export default BiteForceDynamicsChart; 