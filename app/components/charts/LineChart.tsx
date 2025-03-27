import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import { COLORS } from '../../../src/constants';

interface LineChartProps {
  data: number[];
  labels: string[];
  color?: string;
  width?: number;
  height?: number;
}

const screenWidth = Dimensions.get('window').width;

const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  color = COLORS.primary,
  width = screenWidth - 64,
  height = 220
}) => {
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    borderRadius: 16,
    paddingRight: 16,
  }
});

export default LineChart; 