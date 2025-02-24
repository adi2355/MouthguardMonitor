import React, { memo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/src/constants';
import { useDataService } from '@/src/hooks/useDataService';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import Animated, { FadeIn } from 'react-native-reanimated';

const ROUTES = {
  DAILY_AVERAGE: "/dataOverviews/dailyAverageOverview",
  WEEKLY_AVERAGE: "/dataOverviews/weeklyAverage",
  WEEKLY_OVERVIEW: "/dataOverviews/weeklyOverview",
  MONTHLY_OVERVIEW: "/dataOverviews/monthlyOverview",
} as const;

// Enhanced gradient configurations
const gradients = {
  header: ['rgba(0,230,118,0.15)', 'rgba(0,230,118,0.05)', 'transparent'] as const,
  section: ['rgba(0,230,118,0.1)', 'rgba(0,230,118,0.02)', 'transparent'] as const,
  divider: ['rgba(0,230,118,0.1)', 'transparent'] as const,
};

// Enhanced Header component
const Header = memo(() => (
  <View style={styles.headerSection}>
        <LinearGradient
      colors={gradients.header}
      style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
    />
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>Summary</Text>
      <View style={styles.profileContainer}>
        <MaterialCommunityIcons 
          name="account" 
          size={24} 
          color={COLORS.primary}
        />
      </View>
        </View>
        </View>
));

// Enhanced Section component with divider
const Section = memo(({ title, children }: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionWrapper}>
    <LinearGradient
      colors={gradients.divider}
      style={styles.sectionDivider}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    />
    <View style={styles.section}>
      <LinearGradient
        colors={gradients.section}
        style={styles.sectionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  </View>
));

export default memo(function MyData() {
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

  const handleNavigation = useCallback((route: keyof typeof ROUTES) => {
    router.push(ROUTES[route] as any);
  }, [router]);

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

          <Section title="Usage Analytics">
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
            </View>
      </Animated.ScrollView>
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
  headerSection: {
    height: 120,
    position: 'relative',
    backgroundColor: Platform.select({
      ios: 'rgba(26, 26, 26, 0.85)',
      android: 'rgba(26, 26, 26, 0.95)',
    }),
    marginBottom: 24,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,230,118,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  mainContent: {
    paddingHorizontal: 20,
  },
  sectionWrapper: {
    marginBottom: 32,
    position: 'relative',
  },
  sectionDivider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  section: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'rgba(26, 26, 26, 0.75)',
      android: 'rgba(26, 26, 26, 0.9)',
    }),
  },
  sectionGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 230, 118, 0.1)',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  sectionContent: {
    padding: 12,
    gap: 12,
  },
});