import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/src/constants';
import { ChartData } from '@/src/types';
import LineChart from './LineChart';

interface CumulativeExposureGraphProps {
  data: ChartData | null;
  height?: number;
  width?: number;
  noDataMessage?: string;
}

const CumulativeExposureGraph: React.FC<CumulativeExposureGraphProps> = React.memo(({
  data,
  height = 200,
  width = Dimensions.get('window').width - 64,
  noDataMessage = "No impact data available"
}) => {
  // Check if we have valid data to display
  if (!data || !data.datasets || !Array.isArray(data.datasets) || data.datasets.length === 0) {
    return (
      <View style={[styles.container, { height, width }]}>
        <Text style={styles.emptyText}>{noDataMessage}</Text>
      </View>
    );
  }

  // Create a safe version of the data
  const safeData = {
    labels: Array.isArray(data.labels) ? data.labels : [],
    datasets: data.datasets.map(dataset => {
      if (!dataset) return {
        data: [],
        color: (opacity = 1) => 'rgba(0, 122, 255, 1)',
        strokeWidth: 2
      };
      
      return {
        data: Array.isArray(dataset.data) ? dataset.data : [],
        color: typeof dataset.color === 'function' ? dataset.color : 
          (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: typeof dataset.strokeWidth === 'number' ? dataset.strokeWidth : 2
      };
    }),
    legend: data.legend
  };

  // Get last data point (most recent cumulative value)
  const lastDataPoint = safeData.datasets[0]?.data?.length ? 
    safeData.datasets[0].data[safeData.datasets[0].data.length - 1] : 0;

  return (
    <View style={styles.container}>
      {/* Cumulative Value */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalValue}>
          {lastDataPoint !== null && lastDataPoint !== undefined ? Math.round(lastDataPoint) : '0'}
        </Text>
        <Text style={styles.totalLabel}>Total Accumulated G-Force</Text>
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
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
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
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(0, 122, 255, 1)',
  },
  totalLabel: {
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

export default CumulativeExposureGraph; 