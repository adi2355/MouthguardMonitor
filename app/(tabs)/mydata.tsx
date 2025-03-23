import React, { memo, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { useDataService } from '../../src/hooks/useDataService';
import { DataService } from '../../src/services/DataService';
import { BongHit } from '../../src/types';
import Animated, { FadeIn } from 'react-native-reanimated';
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

const ROUTES = {
  DAILY_AVERAGE: "/dataOverviews/dailyAverageOverview",
  WEEKLY_AVERAGE: "/dataOverviews/weeklyAverage",
  WEEKLY_OVERVIEW: "/dataOverviews/weeklyOverview",
  MONTHLY_OVERVIEW: "/dataOverviews/monthlyOverview",
  STRAIN_USAGE: "/dataOverviews/strainUsage",
  BONG_HIT_LOGS: "/dataOverviews/bongHitLogs",
} as const;

export default memo(function MyData() {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(true);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10); // Default goal
  const [bongHitSummary, setBongHitSummary] = useState({
    totalHits: 0,
    averageDuration: 0,
    recentTimestamp: new Date().toISOString()
  });
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  
  const { 
    weeklyData, 
    monthlyData, 
    usageStats, 
    timeDistribution,
    isLoading, 
    error 
  } = useDataService();

  useEffect(() => {
    const fetchBongHitData = async () => {
      try {
        const dataService = DataService.getInstance();
        const bongHitLogsResponse = await dataService.getAllBongHitLogs();
        
        if (bongHitLogsResponse.success && bongHitLogsResponse.data && bongHitLogsResponse.data.length > 0) {
          const logs = bongHitLogsResponse.data;
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
  }, []);

  const handleNavigation = useCallback((route: keyof typeof ROUTES) => {
    router.push(ROUTES[route] as any);
  }, [router]);

  const handleNavigateToAI = () => {
    router.push('/ai/recommendations' as any);
  };
  
  const handleSubscribe = (planId: string) => {
    console.log(`Selected plan: ${planId}`);
    // Here you would implement your actual payment processing
    // For example, using in-app purchases
    
    // For now, just close the modal
    setSubscriptionModalVisible(false);
    
    // Show a success message
    Alert.alert(
      "Subscription Processing",
      "Your subscription request is being processed. This is a demo only."
    );
  };

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

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  const weekdayAvg = usageStats.weekdayStats?.weekday.avg || 0;
  const weekendAvg = usageStats.weekdayStats?.weekend.avg || 0;
  const percentageChange = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

  return (
    <SafeAreaProvider>
      <Animated.ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        entering={FadeIn.duration(200)}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
        <Header />

        <View style={styles.mainContent}>
          {/* Subscription Button */}
          <SubscriptionButton onPress={() => setSubscriptionModalVisible(true)} />
          {/* Goals Section */}
          <Section title="Goals & Tracking">
            <GoalTrackingCard
              currentUsage={usageStats.averageHitsPerDay}
              goalUsage={dailyGoal}
              onEditGoal={() => setGoalModalVisible(true)}
            />
          </Section>

          <Section title="Usage Data">
            <BongHitLogsCard
              totalHits={bongHitSummary.totalHits}
              averageDuration={bongHitSummary.averageDuration}
              recentTimestamp={bongHitSummary.recentTimestamp}
              onPress={() => handleNavigation("BONG_HIT_LOGS")}
            />
            <DailyAverageCard
              data={weeklyData}
              averageHits={usageStats.averageHitsPerDay}
              onPress={() => handleNavigation("DAILY_AVERAGE")}
            />
            <WeeklyUsageBanner
              weeklyData={weeklyData}
              average={usageStats.averageHitsPerDay}
              onPress={() => handleNavigation("WEEKLY_AVERAGE")}
            />
          </Section>

          <Section title="Notifications & Medical">
            {showNotification && (
              <NotificationBanner
                averageHits={usageStats.averageHitsPerDay}
                percentageChange={percentageChange}
                onDismiss={() => setShowNotification(false)}
              />
            )}
            <MedicalCard />
          </Section>

          <Section title="Usage Overview">
            <StrainUsageCard
              strainData={mockStrainData}
              totalHits={usageStats.totalHits || 100}
              onViewAll={() => handleNavigation("STRAIN_USAGE")}
            />
          </Section>

          <Section title="Usage Charts">
            <WeeklyOverviewChart 
              data={weeklyData}
              onPress={() => handleNavigation("WEEKLY_OVERVIEW")}
            />
            <MonthlyOverviewChart 
              data={monthlyData}
              onPress={() => handleNavigation("MONTHLY_OVERVIEW")}
            />
          </Section>

          <Section title="Detailed Statistics">
            <StatsOverviewCard stats={usageStats} />
            <TimeDistributionCard timeData={timeDistribution} />
          </Section>

          

          {/* AI Recommendations Card */}
          <AIRecommendationCard onPress={handleNavigateToAI} />
        </View>
      </Animated.ScrollView>

      {/* Goal Setting Modal */}
      <SetGoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onSave={(goal) => setDailyGoal(goal)}
        currentGoal={dailyGoal}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
        onSubscribe={handleSubscribe}
      />
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  mainContent: {
    paddingHorizontal: 20,
  }
});