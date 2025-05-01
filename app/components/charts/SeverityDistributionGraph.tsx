import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/src/constants';
import BarChart from './BarChart';

interface SeverityDistributionGraphProps {
  data: { labels: string[]; data: number[] };
  height?: number;
  width?: number;
  noDataMessage?: string;
}

const SeverityDistributionGraph: React.FC<SeverityDistributionGraphProps> = React.memo(({
  data,
  height = 200,
  width = Dimensions.get('window').width - 64,
  noDataMessage = "No impact data available"
}) => {
  // Check if we have valid data to display
  const hasData = data && 
                 data.labels && 
                 data.labels.length > 0 && 
                 data.data && 
                 data.data.length > 0 && 
                 data.data.some(val => val > 0);

  if (!hasData) {
    return (
      <View style={[styles.container, { height, width }]}>
        <Text style={styles.emptyText}>{noDataMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarChart 
        data={data.data}
        labels={data.labels}
        barColor={COLORS.primary}
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
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    padding: 20,
  }
});

export default SeverityDistributionGraph; 