import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants';
import Animated, { FadeIn } from 'react-native-reanimated';
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
  
  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      <TouchableOpacity 
        onPress={onViewAll}
        style={styles.touchable}
        activeOpacity={0.9}
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
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Most Used Strains</Text>
              <Text style={styles.subtitle}>
                Based on your last {totalHits} hits
              </Text>
            </View>
            
            <LinearGradient
              colors={['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.1)']}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name="cannabis" 
                size={24} 
                color={COLORS.primary}
              />
            </LinearGradient>
          </View>

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

          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>View Details</Text>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={20} 
                color="#000"
              />
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
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
    marginBottom: 16,
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
  touchable: {
    width: '100%',
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  strainsList: {
    gap: 8,
    marginBottom: 16,
  },
  strainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    marginBottom: 8,
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
  buttonContainer: {
    alignItems: 'flex-start',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
});

export default StrainUsageCard;