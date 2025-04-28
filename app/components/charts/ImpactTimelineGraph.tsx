import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/src/constants';
import { ChartData } from '@/src/types';
import LineChart from './LineChart';

interface ImpactTimelineGraphProps {
  data: ChartData | null;
  totalImpacts?: number | null;
  maxG?: number | null;
  height?: number;
  width?: number;
}

const ImpactTimelineGraph: React.FC<ImpactTimelineGraphProps> = ({
  data,
  totalImpacts,
  maxG,
  height = 180,
  width = Dimensions.get('window').width - 64,
}) => {
  // Check if we have valid data to display
  if (!data || !data.datasets || !Array.isArray(data.datasets) || data.datasets.length === 0) {
    return (
      <View style={[styles.container, { height, width }]}>
        <Text style={styles.emptyText}>No impact data available</Text>
      </View>
    );
  }

  // Create a safe version of the data
  const safeData = {
    labels: Array.isArray(data.labels) ? data.labels : [],
    datasets: data.datasets.map(dataset => {
      if (!dataset) return {
        data: [],
        color: (opacity = 1) => 'rgba(0, 176, 118, 1)',
        strokeWidth: 2
      };
      
      return {
        data: Array.isArray(dataset.data) ? dataset.data : [],
        color: typeof dataset.color === 'function' ? dataset.color : 
          (opacity = 1) => `rgba(0, 176, 118, ${opacity})`,
        strokeWidth: typeof dataset.strokeWidth === 'number' ? dataset.strokeWidth : 2
      };
    }),
    legend: data.legend
  };

  return (
    <View style={styles.container}>
      {/* Stats row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {totalImpacts !== null && totalImpacts !== undefined ? totalImpacts : '0'}
          </Text>
          <Text style={styles.metricLabel}>Total Impacts</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {maxG !== null && maxG !== undefined ? `${maxG}g` : '0g'}
          </Text>
          <Text style={styles.metricLabel}>Max G-Force</Text>
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
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 176, 118, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
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
    justifyContent: 'space-around',
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

export default ImpactTimelineGraph; 