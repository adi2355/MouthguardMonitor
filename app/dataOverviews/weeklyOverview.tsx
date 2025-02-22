import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '@/src/constants';
import { useDataService } from '@/src/hooks/useDataService';
import LoadingView from '@/app/components/LoadingView';
import ErrorView from '@/app/components/ErrorView';
import BarChart from '@/app/components/charts/BarChart';

export default function WeeklyOverview() {
  const { weeklyData, isLoading, error } = useDataService();

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  const chartData = weeklyData.map(d => d.value);
  const chartLabels = weeklyData.map(d => d.label);

  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Weekly Overview</Text>
          <Text style={styles.headerDescription}>
            Detailed view of your weekly usage patterns
          </Text>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartContainer}>
            <BarChart 
              data={chartData}
              labels={chartLabels}
              barColor={COLORS.primary}
            />
          </View>

          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.max(...chartData)}
              </Text>
              <Text style={styles.statLabel}>Peak Day</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round(chartData.reduce((a, b) => a + b, 0) / 7)}
              </Text>
              <Text style={styles.statLabel}>Daily Average</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {chartData.reduce((a, b) => a + b, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Hits</Text>
            </View>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Understanding Your Week</Text>
          <Text style={styles.infoText}>
            This chart shows your daily usage patterns throughout the week. 
            Higher bars indicate more activity on those days. Use this information 
            to understand your usage patterns and make adjustments if needed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.41,
  },
  headerDescription: {
    fontSize: 17,
    color: COLORS.text.secondary,
    marginTop: 8,
    letterSpacing: -0.41,
  },
  chartSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  chartContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    letterSpacing: -0.08,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  infoContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    letterSpacing: 0.38,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
});