import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import { COLORS } from '../../../src/constants';
import { ChartData } from '../../../src/types';

interface LineChartProps {
  data: ChartData | {
    labels: string[];
    datasets: {
      data: number[];
      color: (opacity?: number) => string;
      strokeWidth: number;
    }[];
    legend?: string[];
  };
  width?: number;
  height?: number;
  alwaysShowZero?: boolean;
  chartConfig?: any;
  bezier?: boolean;
  style?: any;
}

const screenWidth = Dimensions.get('window').width;

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = screenWidth - 64,
  height = 220,
  alwaysShowZero = true,
  chartConfig,
  bezier = true,
  style
}) => {
  // Check if we have any datasets
  const hasDatasets = data.datasets && data.datasets.length > 0;
  
  // Check if we have any non-empty datasets
  const hasNonEmptyDatasets = hasDatasets && data.datasets.some(dataset => 
    dataset.data && dataset.data.length > 0 && dataset.data.some(val => val > 0)
  );
  
  // If no data at all, display "No data available" message
  if (!hasDatasets || !hasNonEmptyDatasets) {
    return (
      <View style={[styles.container, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }
  
  // Generate default chart config if not provided
  const defaultChartConfig = chartConfig || {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: COLORS.primary
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

  // Combine styles
  const combinedStyle = {
    ...styles.chart,
    ...(style || {})
  };

  return (
    <View style={styles.container}>
      <RNLineChart
        data={data}
        width={width}
        height={height}
        chartConfig={defaultChartConfig}
        bezier={bezier}
        style={combinedStyle}
        withInnerLines={true}
        withOuterLines={false}
        withHorizontalLabels={true}
        withVerticalLabels={true}
        withDots={true}
        segments={5}
        fromZero={true}
      />
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
  }
});

export default LineChart; 