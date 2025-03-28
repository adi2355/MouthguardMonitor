import React, { memo, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { useDataService } from '../../src/hooks/useDataService';
import { useDailyData } from '../../src/hooks/useDailyData';
import { useCurrentWeekData } from '../../src/hooks/useCurrentWeekData';
import { useBongHitsRepository } from '../../src/providers/AppProvider';
import { databaseManager } from "../../src/DatabaseManager";
import { BongHit, ChartDataPoint } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Import components from their new structure
import LoadingView from '../components/shared/LoadingView';
import ErrorView from '../components/shared/ErrorView';
import Header from '../components/mydata/Header';
import Section from '../components/mydata/Section';
import NotificationBanner from '../components/mydata/NotificationBanner';
import MedicalCard from '../components/mydata/MedicalCard';
import DailyAverageCard from '../components/mydata/DailyAverageCard';
import WeeklyUsageBanner from '../components/mydata/WeeklyUsageBanner';
import WeeklyOverviewChart from '../components/charts/WeeklyOverviewChart';
import MonthlyOverviewChart from '../components/charts/MonthlyOverviewChart';
import StatsOverviewCard from '../components/StatsOverviewCard';
import TimeDistributionCard from '../components/TimeDistributionCard';

// Import new components
import GoalTrackingCard from '../components/mydata/GoalTrackingCard';
import SetGoalModal from '../components/mydata/SetGoalModal';
import StrainUsageCard from '../components/mydata/StrainUsageCard';
import AIRecommendationCard from '../components/mydata/AIRecommendationCard';
import { BongHitLogsCard } from '../components/mydata/BongHitLogsCard';
import SubscriptionButton from '../components/mydata/SubscriptionButton';
import SubscriptionModal from '../components/mydata/SubscriptionModal';
import { AchievementsButton } from '../components/mydata/AchievementsButton';
import { useAchievements } from '../context/AchievementContext';
import { AchievementUnlockedNotification } from '../components/achievements/AchievementUnlockedNotification';

const ROUTES = {
  DAILY_AVERAGE: "/dataOverviews/dailyAverageOverview",
  WEEKLY_AVERAGE: "/dataOverviews/weeklyAverage",
  WEEKLY_OVERVIEW: "/dataOverviews/weeklyOverview",
  MONTHLY_OVERVIEW: "/dataOverviews/monthlyOverview",
  STRAIN_USAGE: "/dataOverviews/strainUsage",
  BONG_HIT_LOGS: "/dataOverviews/bongHitLogs",
} as const;

// Define a type for the average display logic
interface AverageDisplayInfo {
  value: number;
  label: string;
  chartData: ChartDataPoint[];
}

export default memo(function MyData() {
  const router = useRouter();
  const bongHitsRepository = useBongHitsRepository();
  const [showNotification, setShowNotification] = useState(true);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10); // Default goal
  const [bongHitSummary, setBongHitSummary] = useState({
    totalHits: 0,
    averageDuration: 0,
    recentTimestamp: new Date().toISOString()
  });
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const { stats: achievementStats, newlyUnlocked, clearNewlyUnlocked } = useAchievements();
  
  // Note: In a real implementation, this would be based on user selection
  const [currentTimeRange, setCurrentTimeRange] = useState<'D' | 'W' | 'M' | 'Y'>('D'); // Default to daily view
  
  // Use our new hooks
  const { hitsToday, isLoading: dailyLoading, error: dailyError, refresh: refreshDaily } = useDailyData();
  const { currentWeekAverage, isLoading: weeklyLoading, error: weeklyError, refresh: refreshWeekly } = useCurrentWeekData();
  
  // Keep useDataService for holistic data
  const { 
    weeklyData, 
    monthlyData, 
    usageStats, 
    timeDistribution,
    isLoading: dataServiceLoading, 
    error: dataServiceError,
    isRefreshing: dataServiceRefreshing,
    refreshData: refreshDataService
  } = useDataService();

  // Combined loading & error states
  const isLoading = dailyLoading || weeklyLoading || (dataServiceLoading && !dataServiceRefreshing);
  const error = dailyError || weeklyError || dataServiceError;

  useEffect(() => {
    const fetchBongHitData = async () => {
      try {
        const bongHitLogsResponse = await databaseManager.getAllBongHitLogs();
        
        if (bongHitLogsResponse.success && bongHitLogsResponse.data && bongHitLogsResponse.data.length > 0) {
          const logs = bongHitLogsResponse.data as BongHit[];
          const totalDuration = logs.reduce((sum: number, log: BongHit) => sum + log.duration_ms, 0);
          
          setBongHitSummary({
            totalHits: logs.length,
            averageDuration: totalDuration / (logs.length * 1000), // convert to seconds
            recentTimestamp: logs[0].timestamp
          });
        }
      } catch (error) {
        console.error('Failed to fetch bong hit data:', error);
      }
    };
    
    fetchBongHitData();
  }, [dataServiceRefreshing]); // Re-fetch when refreshing

  const handleNavigation = useCallback((route: keyof typeof ROUTES) => {
    router.push(ROUTES[route] as any);
  }, [router]);

  const handleNavigateToAI = () => {
    router.push('/ai/recommendations' as any);
  };
  
  const handleSubscribe = (planId: string) => {
    setSubscriptionModalVisible(false);
    // In a real app, this would process payment and update subscription status
    Alert.alert('Subscription', `Successfully subscribed to plan: ${planId}`);
  };

  const handleAchievementsPress = () => {
    router.push('/screens/AchievementsScreen' as any);
  };
  
  const handleAchievementNotificationPress = () => {
    clearNewlyUnlocked();
    router.push('/screens/AchievementsScreen' as any);
  };

  // Combined refresh handler
  const handleRefresh = useCallback(async () => {
    console.log('[MyData] Manual refresh triggered');
    // Refresh all data sources
    await Promise.all([
      refreshDaily(),
      refreshWeekly(),
      refreshDataService()
    ]);
  }, [refreshDaily, refreshWeekly, refreshDataService]);

  // Calculate which average to display based on the time range
  const getAverageDisplayInfo = (): AverageDisplayInfo => {
    switch (currentTimeRange) {
      case 'D':
        // For 'Day' view, show today's actual hit count from useDailyData
        return { value: hitsToday, label: "Today's Hits", chartData: [] };
      case 'W':
        // For 'Week' view, use the current week average from useCurrentWeekData
        return { value: currentWeekAverage, label: "Daily Avg (This Week)", chartData: weeklyData };
      case 'M':
        // For 'Month' view, use the monthly average
        return { value: usageStats.averageHitsPerDay, label: "Daily Avg (Month)", chartData: [] };
      case 'Y':
        // For 'Year' view, use the yearly average
        return { value: usageStats.averageHitsPerDay, label: "Daily Avg (Year)", chartData: monthlyData };
      default:
        // Default to today's hits
        return { value: hitsToday, label: "Today's Hits", chartData: [] };
    }
  };

  const averageDisplayInfo = getAverageDisplayInfo();

  // Sample strain data - in a real app, this would come from your database
  const mockStrainData = [
    {
      strainId: 1,
      strainName: "Blue Dream",
      strainType: "Hybrid",
      usageCount: 42,
      percentageOfTotal: 35.6
    },
    {
      strainId: 2,
      strainName: "OG Kush",
      strainType: "Indica",
      usageCount: 28,
      percentageOfTotal: 23.7
    },
    {
      strainId: 3,
      strainName: "Sour Diesel",
      strainType: "Sativa",
      usageCount: 18,
      percentageOfTotal: 15.3
    }
  ];

  // Only show loading view on initial load, not during refresh
  if (isLoading && !dataServiceRefreshing) return <LoadingView />;
  if (error && !isLoading) return <ErrorView error={error} />;

  const weekdayAvg = usageStats.weekdayStats?.weekday.avg || 0;
  const weekendAvg = usageStats.weekdayStats?.weekend.avg || 0;
  const percentageChange = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dataServiceRefreshing} // Use dataServiceRefreshing for refresh indicator
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.cardBackground}
          />
        }
      >
        <Header />

        <View style={styles.mainContent}>
          {/* Goals Section */}
          <Section title="Goals & Tracking">
            <GoalTrackingCard
              currentUsage={hitsToday} // Use today's hits from useDailyData
              goalUsage={dailyGoal}
              onEditGoal={() => setGoalModalVisible(true)}
            />
          </Section>

          <Section title="Consumption Data">
            {dailyLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : dailyError ? (
              <Text style={styles.errorText}>{dailyError}</Text>
            ) : (
              <DailyAverageCard
                data={averageDisplayInfo.chartData}
                averageHits={hitsToday} // Use today's hits from useDailyData
                averageLabel="Today's Hits"
                onPress={() => handleNavigation("DAILY_AVERAGE")}
              />
            )}
            
            {weeklyLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : weeklyError ? (
              <Text style={styles.errorText}>{weeklyError}</Text>
            ) : (
              <WeeklyUsageBanner
                weeklyData={weeklyData}
                average={currentWeekAverage} // Use current week average from useCurrentWeekData
                percentageChange={percentageChange}
                averageLabel="Avg Hits/Day (This Week)"
                onPress={() => handleNavigation("WEEKLY_AVERAGE")}
              />
            )}
            
            <BongHitLogsCard
              totalHits={bongHitSummary.totalHits}
              averageDuration={bongHitSummary.averageDuration}
              recentTimestamp={bongHitSummary.recentTimestamp}
              onPress={() => handleNavigation("BONG_HIT_LOGS")}
            />
          </Section>

          <Section title="Usage Overview">
            <StrainUsageCard
              strainData={mockStrainData}
              totalHits={usageStats.totalHits}
              onViewAll={() => handleNavigation("STRAIN_USAGE")}
            />
          </Section>

          <Section title="Detailed Statistics">
            <StatsOverviewCard stats={usageStats} />
            <TimeDistributionCard timeData={timeDistribution} />
          </Section>

          <AIRecommendationCard onPress={handleNavigateToAI} />
          
          <AchievementsButton
            onPress={handleAchievementsPress}
            unlocked={achievementStats.unlocked}
            total={achievementStats.total}
          />
        </View>
      </ScrollView>

      <SetGoalModal
        visible={goalModalVisible}
        currentGoal={dailyGoal}
        onSave={(goal) => {
          setDailyGoal(goal);
          setGoalModalVisible(false);
        }}
        onClose={() => setGoalModalVisible(false)}
      />

      <SubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
        onSubscribe={handleSubscribe}
      />

      {newlyUnlocked && (
        <AchievementUnlockedNotification
          achievement={newlyUnlocked}
          onPress={handleAchievementNotificationPress}
          onDismiss={clearNewlyUnlocked}
        />
      )}
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  mainContent: {
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
    margin: 10,
  }
});