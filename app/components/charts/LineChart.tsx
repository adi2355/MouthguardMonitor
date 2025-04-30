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

// Minimum points needed to render chart reliably
const MIN_DATA_POINTS_FOR_LINE = 2;
const MIN_DATA_POINTS_FOR_BEZIER = 2;

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = screenWidth - 64,
  height = 220,
  alwaysShowZero = true,
  chartConfig,
  bezier = true,
  style
}) => {
  // More robust checks for data and its structure
  if (!data) {
    return (
      <View style={[styles.container, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }
  
  // Check if we have valid datasets
  const hasValidDatasets = data.datasets && 
                          Array.isArray(data.datasets) && 
                          data.datasets.length > 0;
  
  if (!hasValidDatasets) {
    return (
      <View style={[styles.container, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }
  
  // Create safe datasets - ensure each dataset has a valid data array and color function
  // AND filter out any NaN values to prevent SVG path errors
  const safeDatasets = data.datasets.map((dataset, index) => {
    if (!dataset) return { data: [], color: () => 'rgba(0, 230, 118, 1)', strokeWidth: 2 };
    
    // Filter out NaN and non-numeric values
    const safeData = dataset.data && Array.isArray(dataset.data) 
      ? dataset.data.filter(val => typeof val === 'number' && !isNaN(val))
      : [];
      
    return {
      data: safeData,
      color: typeof dataset.color === 'function' ? dataset.color : () => 'rgba(0, 230, 118, 1)',
      strokeWidth: typeof dataset.strokeWidth === 'number' ? dataset.strokeWidth : 2,
    };
  });
  
  // Check if any dataset has enough valid data points based on chart type
  const minPointsRequired = bezier ? MIN_DATA_POINTS_FOR_BEZIER : MIN_DATA_POINTS_FOR_LINE;
  const hasEnoughDataPoints = safeDatasets.some(ds => ds.data.length >= minPointsRequired);
  
  if (!hasEnoughDataPoints) {
    return (
      <View style={[styles.container, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.noDataText}>Insufficient data points</Text>
      </View>
    );
  }
  
  // Create a safe data object
  const safeData = {
    labels: Array.isArray(data.labels) ? data.labels : [],
    datasets: safeDatasets,
    legend: data.legend
  };
  
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
        data={safeData}
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
        fromZero={alwaysShowZero}
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