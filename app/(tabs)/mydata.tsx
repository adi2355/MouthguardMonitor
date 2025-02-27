import React, { memo, useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { useDataService } from '../../src/hooks/useDataService';
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

const ROUTES = {
  DAILY_AVERAGE: "/dataOverviews/dailyAverageOverview",
  WEEKLY_AVERAGE: "/dataOverviews/weeklyAverage",
  WEEKLY_OVERVIEW: "/dataOverviews/weeklyOverview",
  MONTHLY_OVERVIEW: "/dataOverviews/monthlyOverview",
  STRAIN_USAGE: "/dataOverviews/strainUsage",
} as const;

export default memo(function MyData() {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(true);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10); // Default goal
  
  const { 
    weeklyData, 
    monthlyData, 
    usageStats, 
    timeDistribution,
    isLoading, 
    error 
  } = useDataService();

  const handleNavigation = useCallback((route: keyof typeof ROUTES) => {
    router.push(ROUTES[route] as any);
  }, [router]);

  const handleNavigateToAI = () => {
    router.push('/ai/recommendations' as any);
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
          {/* Goals Section */}
          <Section title="Goals & Tracking">
            <GoalTrackingCard
              currentUsage={usageStats.averageHitsPerDay}
              goalUsage={dailyGoal}
              onEditGoal={() => setGoalModalVisible(true)}
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

          <Section title="Analytics">
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

          <TouchableOpacity 
            style={styles.aiFeatureCard}
            onPress={handleNavigateToAI}
          >
            <LinearGradient
              colors={['#4a7c59', '#2c4c36']}
              style={styles.aiCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.aiCardContent}>
                <View style={styles.aiCardIcon}>
                  <MaterialCommunityIcons name="brain" size={32} color="#fff" />
                </View>
                <View style={styles.aiCardTextContainer}>
                  <Text style={styles.aiCardTitle}>AI Recommendations</Text>
                  <Text style={styles.aiCardDescription}>
                    Get personalized strain recommendations and insights based on your usage patterns
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
            </View>
      </Animated.ScrollView>

      {/* Goal Setting Modal */}
      <SetGoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onSave={(goal) => setDailyGoal(goal)}
        currentGoal={dailyGoal}
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
  },
  aiFeatureCard: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiCardGradient: {
    width: '100%',
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  aiCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aiCardTextContainer: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  aiCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});