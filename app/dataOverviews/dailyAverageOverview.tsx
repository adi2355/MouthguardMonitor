import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { useDailyAverageData } from '../../src/hooks/useDailyAverageData';
import { TimeRange } from '../../src/hooks/useTimeRangeData';
import LoadingView from '../components/shared/LoadingView';
import ErrorView from '../components/shared/ErrorView';
import LineChart from '../components/charts/LineChart';

export default function DailyAverageOverview() {
  const router = useRouter();
  const { daily, weekly, monthly, yearly, isLoading, error, refreshData } = useDailyAverageData();
  const [selectedFilter, setSelectedFilter] = useState<TimeRange>('D'); // Default to daily view
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  }, [refreshData]);

  // Get the data for the currently selected filter
  const currentData = useMemo(() => {
    switch (selectedFilter) {
      case 'D': return daily;
      case 'W': return weekly;
      case 'M': return monthly;
      case 'Y': return yearly;
      default: return null;
    }
  }, [selectedFilter, daily, weekly, monthly, yearly]);

  // Only show loading view for initial load, not for refreshes
  if (isLoading && !isRefreshing) return <LoadingView />;
  
  // Check if there's actually any data to display
  const hasRealData = currentData?.chartData.some(item => item.value > 0) || false;

  // Calculate min, max, and average from the current data for display
  const averageValue = currentData?.average || 0;
  const chartData = currentData?.chartData || [];
  
  // Extract values for calculations
  const values = chartData.map(item => item.value);
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const minValue = values.length > 0 ? Math.min(...(values.filter(v => v > 0) || [1])) : 0;

  // Get labels for chart
  const chartLabels = chartData.map(item => item.label);

  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.cardBackground}
          />
        }
      >
        {/* Header with back button */}
        <View style={styles.header}>
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
          <Text style={styles.headerTitle}>Daily Average</Text>
        </View>

        {/* Main Stats Card */}
        <View style={styles.mainStatsCard}>
          <View style={styles.averageContainer}>
            <Text style={styles.averageLabel}>Daily Average</Text>
            <Text style={styles.averageValue}>{hasRealData ? averageValue.toFixed(1) : "0.0"}</Text>
            <Text style={styles.averageUnit}>hits per day</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{hasRealData ? maxValue : 0}</Text>
              <Text style={styles.statLabel}>Max</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{hasRealData ? minValue : 0}</Text>
              <Text style={styles.statLabel}>Min</Text>
            </View>
          </View>
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
                  selectedFilter === range && styles.timeRangeButtonActive
                ]}
                onPress={() => setSelectedFilter(range)}
              >
                <Text style={[
                  styles.timeRangeButtonText,
                  selectedFilter === range && styles.timeRangeButtonTextActive
                ]}>
                  {range === 'D' ? 'Day' : 
                   range === 'W' ? 'Week' : 
                   range === 'M' ? 'Month' : 'Year'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>
            {selectedFilter === 'D' ? 'Day Trend' : 
             selectedFilter === 'W' ? 'Weekly Trend' : 
             selectedFilter === 'M' ? 'Monthly Trend' : 'Yearly Trend'}
          </Text>
          <View style={[styles.chartContainer, isRefreshing && styles.chartRefreshing]}>
            {isRefreshing && (
              <View style={styles.refreshingOverlay}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            )}
            {!currentData && !isRefreshing ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No data available for this time range</Text>
              </View>
            ) : (
              <LineChart 
                data={values}
                labels={chartLabels}
                color={COLORS.primary}
                alwaysShowZero={true}
              />
            )}
          </View>
        </View>

        {/* Analysis Section */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>Insights</Text>
          
          <View style={styles.insightCard}>
            <View style={styles.insightIconContainer}>
              <MaterialCommunityIcons 
                name="trending-up" 
                size={24} 
                color={COLORS.primary} 
              />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Usage Pattern</Text>
              <Text style={styles.insightText}>
                {hasRealData ? (
                  averageValue > 10 
                    ? "Your daily usage is above average. Consider setting daily limits."
                    : "Your daily usage is within a moderate range."
                ) : (
                  "No usage data available to analyze patterns."
                )}
              </Text>
            </View>
          </View>
          
          <View style={styles.insightCard}>
            <View style={styles.insightIconContainer}>
              <MaterialCommunityIcons 
                name="calendar-check" 
                size={24} 
                color={COLORS.primary} 
              />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Consistency</Text>
              <Text style={styles.insightText}>
                {hasRealData ? (
                  maxValue / (minValue || 1) > 3
                    ? "Your usage varies significantly day to day."
                    : "Your usage is relatively consistent throughout the week."
                ) : (
                  "No usage data available to analyze consistency."
                )}
              </Text>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.35,
  },
  mainStatsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  averageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  averageLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  averageValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  averageUnit: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeRangeContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
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
  chartSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  chartContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 200,
  },
  chartRefreshing: {
    opacity: 0.7,
  },
  refreshingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  noDataText: {
    color: COLORS.text.tertiary,
    fontSize: 14,
  },
  analysisSection: {
    paddingHorizontal: 16,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
});