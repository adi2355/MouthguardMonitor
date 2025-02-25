import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants';
import Animated, { FadeIn } from 'react-native-reanimated';

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
  
  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header with icon */}
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons 
              name="cannabis" 
              size={20} 
              color={COLORS.primary}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Most Used Strains</Text>
            <Text style={styles.subtitle}>
              Based on your last {totalHits} hits
            </Text>
          </View>
        </View>

        {/* Strains List */}
        <View style={styles.strainsList}>
          {topStrains.map((strain, index) => (
            <View key={strain.strainId} style={styles.strainItem}>
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

        {/* View All Button */}
        <TouchableOpacity 
          onPress={onViewAll}
          style={styles.viewDetailsButton}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={16} 
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0C140E',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    marginBottom: 12,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  strainsList: {
    gap: 8,
    marginBottom: 16,
  },
  strainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  strainInfo: {
    flex: 1,
  },
  strainName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  strainType: {
    fontSize: 13,
    color: COLORS.primary,
  },
  strainStats: {
    flex: 2,
    alignItems: 'flex-end',
  },
  usageCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: 'rgba(255, 255, 255, 0.7)',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
});

export default StrainUsageCard;