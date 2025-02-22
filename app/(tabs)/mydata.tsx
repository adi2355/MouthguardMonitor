import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/src/constants';
import { useDataService } from '@/src/hooks/useDataService';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import LoadingView from '@/app/components/LoadingView';
import ErrorView from '@/app/components/ErrorView';
import NotificationBanner from '@/app/components/NotificationBanner';
import MedicalCard from '@/app/components/MedicalCard';
import DailyAverageCard from '@/app/components/DailyAverageCard';
import WeeklyUsageBanner from '@/app/components/WeeklyUsageBanner';
import WeeklyOverviewChart from '@/app/components/charts/WeeklyOverviewChart';
import MonthlyOverviewChart from '@/app/components/charts/MonthlyOverviewChart';
import StatsOverviewCard from '@/app/components/StatsOverviewCard';
import TimeDistributionCard from '@/app/components/TimeDistributionCard';

const ROUTES = {
  DAILY_AVERAGE: "/dataOverviews/dailyAverageOverview",
  WEEKLY_AVERAGE: "/dataOverviews/weeklyAverage",
  WEEKLY_OVERVIEW: "/dataOverviews/weeklyOverview",
  MONTHLY_OVERVIEW: "/dataOverviews/monthlyOverview",
} as const;

export default function MyData() {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(true);
  const { 
    weeklyData, 
    monthlyData, 
    usageStats, 
    timeDistribution,
    isLoading, 
    error 
  } = useDataService();

  const handleNavigation = (route: keyof typeof ROUTES) => {
    router.push(ROUTES[route] as any); // Type assertion to fix router.push type error
  };

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  // Calculate percentage change between weekday and weekend averages
  const weekdayAvg = usageStats.weekdayStats?.weekday.avg || 0;
  const weekendAvg = usageStats.weekdayStats?.weekend.avg || 0;
  const percentageChange = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Header with Gradient */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['rgba(0,230,118,0.2)', 'rgba(105,240,174,0.1)', 'rgba(0,0,0,0)']}
            style={styles.headerGradient}
          />
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Summary</Text>
            <View style={styles.profilePic} />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Top Section - Notification & Medical */}
          <View style={styles.section}>
            {showNotification && (
              <NotificationBanner
                averageHits={usageStats.averageHitsPerDay}
                percentageChange={percentageChange}
                onDismiss={() => setShowNotification(false)}
              />
            )}
            <MedicalCard />
          </View>

          {/* Usage Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Overview</Text>
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
          </View>

          {/* Charts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Analytics</Text>
            <WeeklyOverviewChart 
              data={weeklyData}
              onPress={() => handleNavigation("WEEKLY_OVERVIEW")}
            />
            <MonthlyOverviewChart 
              data={monthlyData}
              onPress={() => handleNavigation("MONTHLY_OVERVIEW")}
            />
          </View>

          {/* Detailed Stats Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed Statistics</Text>
            <StatsOverviewCard stats={usageStats} />
            <TimeDistributionCard timeData={timeDistribution} />
          </View>

          {/* Time Range Section */}
          <View style={[styles.section, styles.lastSection]}>
            <Card style={styles.timeRangeCard}>
              <View style={styles.timeRangeContent}>
                <Text style={styles.cardTitle}>Pick Time Range</Text>
                <AntDesign name="calendar" size={24} color={COLORS.primary} />
              </View>
            </Card>
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
  headerSection: {
    paddingTop: 8,
    marginBottom: 20,
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 150,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.41,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
    letterSpacing: 0.38,
  },
  timeRangeCard: {
    marginBottom: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  timeRangeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
    letterSpacing: -0.41,
  },
});