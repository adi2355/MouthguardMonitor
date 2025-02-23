import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from "@/components/Card";
import { COLORS } from "@/src/constants";
import { UsageStats } from "@/src/types";
import Animated, { FadeIn } from 'react-native-reanimated';

interface StatsOverviewCardProps {
  stats: UsageStats;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const StatsOverviewCard: React.FC<StatsOverviewCardProps> = ({ stats }) => {
  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      <LinearGradient
        colors={[
          'rgba(0,230,118,0.15)',
          'rgba(0,230,118,0.05)',
          'transparent'
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Usage Statistics</Text>
            <Text style={styles.subtitle}>
              Detailed overview of your usage patterns
            </Text>
          </View>
          
          <LinearGradient
            colors={['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.1)']}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons 
              name="chart-box-outline" 
              size={24} 
              color={COLORS.primary}
            />
          </LinearGradient>
        </View>

        {/* Hit Counts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hit Counts</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Daily Average</Text>
              <Text style={styles.statValue}>{stats.averageHitsPerDay.toFixed(1)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Peak Day</Text>
              <Text style={styles.statValue}>{stats.peakDayHits}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Hits</Text>
              <Text style={styles.statValue}>{stats.totalHits}</Text>
            </View>
          </View>
        </View>

        {/* Duration Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{formatDuration(stats.averageDuration)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Longest</Text>
              <Text style={styles.statValue}>{formatDuration(stats.longestHit)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Shortest</Text>
              <Text style={styles.statValue}>{formatDuration(stats.shortestHit)}</Text>
            </View>
          </View>
        </View>

        {/* Time Patterns Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Patterns</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Peak Hours</Text>
              <Text style={styles.statValue}>{stats.mostActiveHour}:00</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Quiet Hours</Text>
              <Text style={styles.statValue}>{stats.leastActiveHour}:00</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Consistency</Text>
              <Text style={styles.statValue}>{stats.consistency.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Weekday vs Weekend */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Weekly Distribution</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Weekday Avg</Text>
              <Text style={styles.statValue}>
                {stats.weekdayStats.weekday.avg.toFixed(1)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Weekend Avg</Text>
              <Text style={styles.statValue}>
                {stats.weekdayStats.weekend.avg.toFixed(1)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Difference</Text>
              <View style={styles.changeContainer}>
                <MaterialCommunityIcons 
                  name={stats.weekdayStats.weekend.avg >= stats.weekdayStats.weekday.avg ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={stats.weekdayStats.weekend.avg >= stats.weekdayStats.weekday.avg ? COLORS.primary : '#FF5252'} 
                />
                <Text style={[
                  styles.changeText,
                  { color: stats.weekdayStats.weekend.avg >= stats.weekdayStats.weekday.avg ? COLORS.primary : '#FF5252' }
                ]}>
                  {Math.abs(((stats.weekdayStats.weekend.avg - stats.weekdayStats.weekday.avg) / stats.weekdayStats.weekday.avg) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'rgba(26, 26, 26, 0.8)',
      android: 'rgba(26, 26, 26, 0.95)',
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    letterSpacing: 0.35,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    letterSpacing: 0.25,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
    letterSpacing: -0.41,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default StatsOverviewCard; 