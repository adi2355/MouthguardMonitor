import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { COLORS } from '@/src/constants';
import { LinearGradient } from 'expo-linear-gradient';
import chartStyles from './ChartStyles';

interface ConcussionRiskGaugeProps {
  risk?: 'Low' | 'Moderate' | 'High' | 'Critical' | null;
  width?: number;
}

const ConcussionRiskGauge: React.FC<ConcussionRiskGaugeProps> = React.memo(({
  risk = 'Low',
  width = Dimensions.get('window').width - 64,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  
  // Default to 'Low' if risk is undefined or null
  const safeRisk = risk || 'Low';
  
  // Calculate indicator position and colors using Apple's color palette
  let percentage = 0;
  let textColor = '';
  
  switch (safeRisk) {
    case 'Critical':
      percentage = 100;
      textColor = '#BF5AF2'; // Apple Purple
      break;
    case 'High':
      percentage = 75;
      textColor = '#FF453A'; // Apple Red
      break;
    case 'Moderate':
      percentage = 50;
      textColor = '#FF9F0A'; // Apple Orange
      break;
    case 'Low':
    default:
      percentage = 25;
      textColor = '#32D74B'; // Apple Green
      break;
  }
  
  // Calculate position for the indicator
  const indicatorPosition = (percentage / 100) * (width - 32);
  
  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(indicatorAnim, {
        toValue: indicatorPosition,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, [indicatorPosition]);
  
  return (
    <Animated.View style={[
      styles.container, 
      { 
        width,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      <Text style={[chartStyles.primaryValue, { color: textColor, fontSize: 28 }]}>
        {safeRisk}
      </Text>
      <Text style={chartStyles.label}>
        Concussion Risk Level
      </Text>
      
      {/* Gauge Track with Gradient */}
      <View style={[styles.gaugeTrackContainer, { width: width - 32 }]}>
        <LinearGradient
          colors={['#32D74B', '#FF9F0A', '#FF453A', '#BF5AF2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gaugeTrack}
        />
        
        {/* Risk labels */}
        <View style={styles.riskLabelContainer}>
          <Text style={[styles.riskLabelText, { color: '#32D74B' }]}>Low</Text>
          <Text style={[styles.riskLabelText, { color: '#FF9F0A' }]}>Moderate</Text>
          <Text style={[styles.riskLabelText, { color: '#FF453A' }]}>High</Text>
          <Text style={[styles.riskLabelText, { color: '#BF5AF2' }]}>Critical</Text>
        </View>
        
        {/* Animated Gauge indicator */}
        <Animated.View 
          style={[
            styles.gaugeIndicator, 
            { 
              backgroundColor: textColor,
              transform: [{ translateX: indicatorAnim }],
            }
          ]} 
        />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  gaugeTrackContainer: {
    height: 8,
    marginTop: 32,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 12,
    width: '100%',
  },
  gaugeIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: -4,
    left: 0,
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  riskLabelContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskLabelText: {
    fontSize: 13,
    fontWeight: '500',
  }
});

export default ConcussionRiskGauge; 