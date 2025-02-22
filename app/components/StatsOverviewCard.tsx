import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { COLORS } from "@/src/constants";
import { UsageStats } from "@/src/types";

interface StatsOverviewCardProps {
  stats: UsageStats;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function StatsOverviewCard({ stats }: StatsOverviewCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="chart-box-outline" 
          size={24} 
          color={COLORS.primary}
        />
        <Text style={styles.headerText}>Usage Statistics</Text>
      </View>

      <View style={styles.statsGrid}>
        {/* Hit Counts Section */}
        <View style={styles.statGroup}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.averageHitsPerDay}</Text>
            <Text style={styles.statLabel}>Daily Average</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.peakDayHits}</Text>
            <Text style={styles.statLabel}>Peak Day</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalHits}</Text>
            <Text style={styles.statLabel}>Total Hits</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Duration Stats Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Average</Text>
              <Text style={styles.detailValue}>{formatDuration(stats.averageDuration)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Longest</Text>
              <Text style={styles.detailValue}>{formatDuration(stats.longestHit)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Time Patterns Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Peak Hours</Text>
              <Text style={styles.detailValue}>{stats.mostActiveHour}:00</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Consistency</Text>
              <Text style={styles.detailValue}>{stats.consistency.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 10,
    letterSpacing: 0.38,
  },
  statsGrid: {
    gap: 20,
  },
  statGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statItem: {
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
  },
  detailsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    letterSpacing: -0.24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 4,
    letterSpacing: -0.08,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
    letterSpacing: -0.41,
  },
}); 