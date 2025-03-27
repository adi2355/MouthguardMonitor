import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from "../../../src/constants";
import Animated, { 
  FadeInDown,
  Layout
} from 'react-native-reanimated';

interface BongHitLogsSummaryProps {
  totalHits: number;
  averageDuration: number;
  recentTimestamp: string;
  onPress: () => void;
}

export const BongHitLogsCard: React.FC<BongHitLogsSummaryProps> = ({ 
  totalHits, 
  averageDuration, 
  recentTimestamp, 
  onPress 
}) => {
  const formattedDate = new Date(recentTimestamp).toLocaleString();
  
  // Enhanced gradient combinations with type assertions
  const gradientBase = ['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.08)', 'transparent'] as const;
  const accentGradient = ['rgba(0,230,118,0.3)', 'rgba(0,230,118,0.15)'] as const;

  return (
    <Animated.View 
      entering={FadeInDown.springify()}
      layout={Layout.springify()}
      style={styles.container}
    >
      {/* Enhanced Background Gradient */}
      <LinearGradient
        colors={gradientBase}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Shimmer Effect Layer */}
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent'] as const}
        style={styles.shimmerEffect}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={accentGradient}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name="pipe" 
                size={22} 
                color={COLORS.primary}
              />
            </LinearGradient>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Consumption History</Text>
              <Text style={styles.subtitle}>{totalHits} total recorded hits</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Stats Container */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const}
            style={styles.statsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg Duration</Text>
              <Text style={styles.statValue}>{averageDuration.toFixed(1)}s</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Latest Hit</Text>
              <Text style={styles.statValue}>{formattedDate.split(',')[0]}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Message Box */}
        <View style={styles.messageContainer}>
          <LinearGradient
            colors={accentGradient}
            style={styles.statusIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons
              name="history"
              size={24}
              color={COLORS.primary}
            />
          </LinearGradient>

          <Text style={styles.messageText}>
            Access your complete consumption history with detailed analytics and session logs
          </Text>
        </View>

        {/* Action Button - Maintain original functionality */}
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
          <LinearGradient
            colors={[COLORS.primary, `${COLORS.primary}CC`] as const}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.actionText}>View All Logs</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={18} 
              color="#FFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  shimmerEffect: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  statsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  statsGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 12,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginRight: 4,
  },
});

// Add default export for expo-router
export default BongHitLogsCard;