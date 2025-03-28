import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { useTimeRangeData } from '../../src/hooks/useTimeRangeData';
import LoadingView from '../components/shared/LoadingView';
import ErrorView from '../components/shared/ErrorView';
import LineChart from '../components/charts/LineChart';

export default function WeeklyAverage() {
  const router = useRouter();
  const { 
    timeRange, 
    setTimeRange, 
    data, 
    isLoading, 
    isRefreshing,
    error,
    refreshTimeRangeData
  } = useTimeRangeData('W'); // Default to weekly view

  if (isLoading && !isRefreshing) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  // Check if there's actually any data to display
  const hasRealData = data.chartData.some(value => value > 0);

  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshTimeRangeData}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.cardBackground}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={28} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Average</Text>
          <Text style={styles.headerDescription}>
            Analysis of your average usage patterns
          </Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <View style={styles.timeRangeButtons}>
            {(['D', 'W', 'M', 'Y'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  timeRange === range && styles.timeRangeButtonActive
                ]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[
                  styles.timeRangeButtonText,
                  timeRange === range && styles.timeRangeButtonTextActive
                ]}>
                  {range === 'D' ? 'Day' : 
                   range === 'W' ? 'Week' : 
                   range === 'M' ? 'Month' : 'Year'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Average Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {hasRealData ? (data.weekdayAvg?.toFixed(1) || '0.0') : '0.0'}
              </Text>
              <Text style={styles.statLabel}>Weekday Avg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {hasRealData ? (data.weekendAvg?.toFixed(1) || '0.0') : '0.0'}
              </Text>
              <Text style={styles.statLabel}>Weekend Avg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {hasRealData ? data.averageValue.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.statLabel}>Total Avg</Text>
            </View>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>
            {timeRange === 'D' ? 'Daily' : 
             timeRange === 'W' ? 'Weekly' : 
             timeRange === 'M' ? 'Monthly' : 'Yearly'} Trend
          </Text>
          <View style={styles.chartContainer}>
            <LineChart 
              data={data.chartData}
              labels={data.chartLabels}
              color={COLORS.primary}
              alwaysShowZero={true}
            />
          </View>
        </View>

        {/* Analysis Section */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>Usage Analysis</Text>
          
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Weekday vs Weekend</Text>
            <Text style={styles.analysisText}>
              {hasRealData ? (
                (data.weekendAvg || 0) > (data.weekdayAvg || 0) 
                  ? `Your weekend usage is ${(((data.weekendAvg || 0) / Math.max(data.weekdayAvg || 0.001, 0.001)) * 100 - 100).toFixed(1)}% higher than weekdays.`
                  : `Your weekday usage is ${(((data.weekdayAvg || 0) / Math.max(data.weekendAvg || 0.001, 0.001)) * 100 - 100).toFixed(1)}% higher than weekends.`
              ) : (
                'No usage data available to compare weekday and weekend patterns.'
              )}
            </Text>
          </View>
          
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>
              {timeRange === 'D' ? 'Daily' : 
               timeRange === 'W' ? 'Weekly' : 
               timeRange === 'M' ? 'Monthly' : 'Yearly'} Pattern
            </Text>
            <Text style={styles.analysisText}>
              {hasRealData ? (
                Math.max(...data.chartData) > data.averageValue * 1.5 
                  ? "Your usage tends to spike significantly on certain days." 
                  : "Your usage tends to be relatively consistent throughout the period."
              ) : (
                'No usage data available to analyze patterns.'
              )}
            </Text>
          </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    marginBottom: 12,
  },
  timeRangeContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  timeRangeButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: -0.08,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  chartSection: {
    marginTop: 24,
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
  analysisSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  analysisCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  emptyChartContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyChartText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
}); 