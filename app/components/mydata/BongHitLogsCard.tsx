import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants';
import Animated, { FadeIn } from 'react-native-reanimated';

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
  
  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      <TouchableOpacity 
        onPress={onPress}
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
              <Text style={styles.title}>Logs</Text>
              <Text style={styles.subtitle}>
                {totalHits} total recorded hits
              </Text>
            </View>
            
            <LinearGradient
              colors={['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.1)']}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name="pipe" 
                size={24} 
                color={COLORS.primary}
              />
            </LinearGradient>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averageDuration.toFixed(1)}s</Text>
              <Text style={styles.statLabel}>Avg Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formattedDate.split(',')[0]}
              </Text>
              <Text style={styles.statLabel}>Latest Hit</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>View All Logs</Text>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={20} 
                color="#FFF"
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
    minHeight: 120,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 0.2,
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
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});