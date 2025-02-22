import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/src/constants';

interface BarChartProps {
  data: number[];
  labels: string[];
  maxValue?: number;
  barColor?: string;
}

const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  labels, 
  maxValue: propMaxValue, 
  barColor = COLORS.primary
}) => {
  // Calculate maxValue if not provided
  const maxValue = propMaxValue || Math.max(...data) * 1.2; // Add 20% padding
  const chartHeight = 220;
  const divisions = 5; // Number of horizontal lines

  // Generate y-axis labels
  const yAxisLabels = Array.from({ length: divisions + 1 }, (_, i) => {
    const value = (maxValue / divisions) * (divisions - i);
    return Math.round(value).toString();
  });

  return (
    <View style={styles.container}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        {yAxisLabels.map((label, index) => (
          <Text key={index} style={styles.yAxisLabel}>
            {label}
          </Text>
        ))}
      </View>

      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Horizontal grid lines */}
        {yAxisLabels.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.gridLine,
              { top: (chartHeight / divisions) * index }
            ]} 
          />
        ))}

        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barLabelContainer}>
                  <Text style={styles.barValue}>{value}</Text>
                </View>
                <View style={[styles.barBackground, { height: barHeight }]}>
                  <LinearGradient
                    colors={[
                      `${barColor}CC`, // 80% opacity
                      `${barColor}66`, // 40% opacity
                    ]}
                    style={[styles.bar, { height: '100%' }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </View>
                <Text style={styles.xAxisLabel}>{labels[index]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 280, // Include space for labels
    paddingRight: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  yAxis: {
    width: 50,
    justifyContent: 'space-between',
    marginRight: 10,
  },
  yAxisLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    height: 220,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barLabelContainer: {
    position: 'absolute',
    top: -20,
    width: '100%',
    alignItems: 'center',
  },
  barValue: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  barBackground: {
    width: '60%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  xAxisLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 8,
  },
});

export default BarChart; 