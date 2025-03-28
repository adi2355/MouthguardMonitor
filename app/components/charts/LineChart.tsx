import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import { COLORS } from '../../../src/constants';

interface LineChartProps {
  data: number[];
  labels: string[];
  color?: string;
  width?: number;
  height?: number;
  alwaysShowZero?: boolean;
}

const screenWidth = Dimensions.get('window').width;

const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  color = COLORS.primary,
  width = screenWidth - 64,
  height = 220,
  alwaysShowZero = true
}) => {
  // Check if we have data to display (any data points)
  const hasAnyData = data && data.length > 0;
  
  // Check if we have any non-zero values
  const hasNonZeroData = hasAnyData && data.some(val => val > 0);
  
  // If no data at all, display "No data available" message
  if (!hasAnyData) {
    return (
      <View style={[styles.container, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }
  
  // If all values are zero and we don't want to show zero charts
  if (!hasNonZeroData && !alwaysShowZero) {
    return (
      <View style={[styles.container, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.noDataText}>No data available for this time period</Text>
      </View>
    );
  }
  
  // Validate data to prevent NaN values
  const validatedData = data.map(val => (isNaN(val) ? 0 : val));
  
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: color
    },
    propsForBackgroundLines: {
      strokeDasharray: '5, 5',
      stroke: 'rgba(255, 255, 255, 0.1)',
      strokeWidth: 1
    },
    propsForLabels: {
      fontSize: 10
    }
  };

  return (
    <View style={styles.container}>
      <RNLineChart
        data={{
          labels,
          datasets: [
            {
              data: validatedData,
              color: (opacity = 1) => color ? `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : `rgba(0, 230, 118, ${opacity})`,
              strokeWidth: 2
            }
          ]
        }}
        width={width}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withHorizontalLabels={true}
        withVerticalLabels={true}
        withDots={true}
        segments={5}
        fromZero={true}
      />
      
      {/* Show an overlay message when all values are zero but we're still showing the chart */}
      {!hasNonZeroData && alwaysShowZero && (
        <View style={styles.zeroDataOverlay}>
          <Text style={styles.zeroDataText}>No activity recorded</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  chart: {
    borderRadius: 16,
  },
  noDataText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  zeroDataOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  zeroDataText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  }
});

export default LineChart; 