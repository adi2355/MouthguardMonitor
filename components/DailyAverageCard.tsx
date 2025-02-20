import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Datapoint } from '@/src/types';

const windowWidth = Dimensions.get('window').width;

const COLORS = {
  background: '#000000',
  cardBackground: '#1A1A1A',
  chartBackground: '#004d29', // Darker forest green from screenshot
  primary: '#00E676',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
  },
};

interface DailyAverageCardProps {
  data: Datapoint[];
  averageHits: number;
  onPress: () => void;
}

export const DailyAverageCard: React.FC<DailyAverageCardProps> = ({ 
  data, 
  averageHits,
  onPress 
}) => {
  // Format data for the chart
  const chartData = {
    labels: [],
    datasets: [{
      data: data.map(d => d.value) || [4, 3, 5, 3, 4, 3, 4],
      color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
      strokeWidth: 2
    }]
  };

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Daily Average</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          On average, your daily hits were more than usual this week.
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.valueText}>{averageHits}</Text>
          <Text style={styles.unitText}>hits per day</Text>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={windowWidth - 64}
            height={100}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: COLORS.chartBackground,
              backgroundGradientTo: COLORS.chartBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
              labelColor: () => 'transparent',
              propsForDots: {
                r: "4",
                strokeWidth: "0",
                stroke: COLORS.primary
              },
              propsForBackgroundLines: {
                stroke: "rgba(255, 255, 255, 0.1)",
              },
            }}
            bezier
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={false}
            withHorizontalLabels={false}
            withShadow={false}
            style={styles.chart}
          />
        </View>

        {/* More Details Link */}
        <TouchableOpacity style={styles.moreDetails} onPress={onPress}>
          <Text style={styles.moreDetailsText}>More details</Text>
          <Text style={styles.moreDetailsArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  description: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 16,
  },
  valueText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: COLORS.chartBackground,
    borderRadius: 12,
    marginVertical: 8,
    padding: 8,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 12,
    paddingRight: 0,
    paddingLeft: 0,
  },
  moreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  moreDetailsText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
  moreDetailsArrow: {
    fontSize: 18,
    color: COLORS.primary,
  },
});