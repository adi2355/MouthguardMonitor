import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/src/constants';
import { ChartData } from '@/src/types';
import LineChart from './LineChart';

interface TemperatureStabilityGraphProps {
  data: ChartData;
  avgTemp?: number | null;
  maxTemp?: number | null;
  currentTemp?: number | null;
  height?: number;
  width?: number;
}

const TemperatureStabilityGraph: React.FC<TemperatureStabilityGraphProps> = ({
  data,
  avgTemp,
  maxTemp,
  currentTemp,
  height = 180,
  width = Dimensions.get('window').width - 64,
}) => {
  // Check if we have valid data to display
  if (!data || !data.datasets || !Array.isArray(data.datasets) || data.datasets.length === 0) {
    return (
      <View style={[styles.container, { height, width }]}>
        <Text style={styles.emptyText}>No temperature data available</Text>
      </View>
    );
  }

  // Create a safe version of the data
  const safeData = {
    labels: Array.isArray(data.labels) ? data.labels : [],
    datasets: data.datasets.map(dataset => {
      if (!dataset) return {
        data: [],
        color: (opacity = 1) => 'rgba(255, 149, 0, 1)',
        strokeWidth: 2
      };
      
      return {
        data: Array.isArray(dataset.data) ? dataset.data : [],
        color: typeof dataset.color === 'function' ? dataset.color : 
          (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        strokeWidth: typeof dataset.strokeWidth === 'number' ? dataset.strokeWidth : 2
      };
    }),
    legend: data.legend
  };

  return (
    <View style={styles.container}>
      {/* KPI stats */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: 'rgba(255, 149, 0, 1)' }]}>
            {currentTemp !== null && currentTemp !== undefined ? currentTemp : '--'}°F
          </Text>
          <Text style={styles.metricLabel}>Current</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {avgTemp !== null && avgTemp !== undefined ? avgTemp : '--'}°F
          </Text>
          <Text style={styles.metricLabel}>Average</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {maxTemp !== null && maxTemp !== undefined ? maxTemp : '--'}°F
          </Text>
          <Text style={styles.metricLabel}>Maximum</Text>
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
          backgroundGradientFrom: 'transparent',
          backgroundGradientTo: 'transparent',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "2",
            strokeWidth: "1",
          },
          propsForBackgroundLines: {
            strokeDasharray: '4, 4',
            strokeWidth: 0.5,
            stroke: 'rgba(0, 0, 0, 0.05)',
          },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    padding: 20,
  }
});

export default TemperatureStabilityGraph; 