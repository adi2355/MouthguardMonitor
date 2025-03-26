import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface StrainUsage {
  strainId: number;
  strainName: string;
  strainType: string;
  usageCount: number;
  percentageOfTotal: number;
}

interface StrainUsageCardProps {
  strainData: StrainUsage[];
  totalHits: number;
  onViewAll: () => void;
}

const StrainUsageCard = ({ strainData, totalHits, onViewAll }: StrainUsageCardProps) => {
  // Just show the top 3 strains
  const topStrains = strainData.slice(0, 3);
  
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
                name="cannabis" 
                size={22} 
                color={COLORS.primary}
              />
            </LinearGradient>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Most Used Strains</Text>
              <Text style={styles.subtitle}>
                Based on your last {totalHits} hits
              </Text>
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
            <View style={styles.strainsList}>
              {topStrains.map((strain, index) => (
                <View key={strain.strainId} style={[
                  styles.strainItem,
                  index < topStrains.length - 1 && styles.strainItemWithBorder
                ]}>
                  <View style={styles.strainInfo}>
                    <Text style={styles.strainName}>{strain.strainName}</Text>
                    <Text style={styles.strainType}>{strain.strainType}</Text>
                  </View>
                  
                  <View style={styles.strainStats}>
                    <Text style={styles.usageCount}>{strain.usageCount} hits</Text>
                    <View style={styles.percentageContainer}>
                      <View 
                        style={[
                          styles.percentageFill, 
                          { width: `${strain.percentageOfTotal}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {strain.percentageOfTotal.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
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
              name="chart-pie"
              size={24}
              color={COLORS.primary}
            />
          </LinearGradient>

          <Text style={styles.messageText}>
            Your most used strain is {topStrains[0]?.strainName}, accounting for {topStrains[0]?.percentageOfTotal.toFixed(1)}% of your total consumption
          </Text>
        </View>

        {/* Action Button - Maintain original functionality */}
        <TouchableOpacity style={styles.actionButton} onPress={onViewAll}>
          <LinearGradient
            colors={[COLORS.primary, `${COLORS.primary}CC`] as const}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.actionText}>View Details</Text>
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
    padding: 16,
  },
  strainsList: {
    gap: 12,
  },
  strainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  strainItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 12,
    marginBottom: 4,
  },
  strainInfo: {
    flex: 1,
  },
  strainName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  strainType: {
    fontSize: 14,
    color: COLORS.primary,
  },
  strainStats: {
    flex: 2,
    alignItems: 'flex-end',
  },
  usageCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  percentageContainer: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
    marginBottom: 4,
  },
  percentageFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    color: COLORS.text.secondary,
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

export default StrainUsageCard;