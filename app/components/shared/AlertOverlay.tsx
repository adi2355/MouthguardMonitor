import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dataChangeEmitter } from '@/src/utils/EventEmitter';
import { ConcussionAlert } from '@/src/types';
import { COLORS } from '@/src/constants';
import { useRouter } from 'expo-router';

const AlertOverlay: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<ConcussionAlert | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleAlert = (alertData: ConcussionAlert) => {
      // Only show unacknowledged alerts, prioritize critical ones if multiple arrive
      if (!alertData.acknowledged) {
        // Simple logic: just show the latest alert
        setActiveAlert(alertData);
      }
    };

    dataChangeEmitter.on('ALERT_TRIGGERED', handleAlert);

    return () => {
      dataChangeEmitter.off('ALERT_TRIGGERED', handleAlert);
    };
  }, []);

  const handleAcknowledge = async () => {
    if (activeAlert) {
      // In a real app, call a repository method to update alert status
      console.log(`Acknowledging alert: ${activeAlert.id}`);
      // Simulate API call
      try {
        // await alertRepository.acknowledgeAlert(activeAlert.id);
        // For now, just hide the alert
        setActiveAlert(null);
      } catch (error) {
        console.error('Error acknowledging alert:', error);
      }
    }
  };

  const handleViewDetails = () => {
    if (activeAlert) {
      // Navigate to alert details or athlete profile
      console.log(`Viewing details for alert: ${activeAlert.id}`);
      
      if (activeAlert.athleteId) {
        // Navigate to athlete detail page if we have an athlete
        router.push({
          pathname: '/athletes/[id]',
          params: { id: activeAlert.athleteId }
        });
      } else {
        // Otherwise go to reports/impacts page
        router.push('/reports');
      }
      
      // Hide alert after navigating
      setActiveAlert(null);
    }
  };

  if (!activeAlert) {
    return null;
  }

  const getAlertColor = (severity: string | undefined) => {
    switch (severity) {
      case 'critical':
        return COLORS.error;
      case 'severe':
        return COLORS.error;
      case 'moderate':
        return COLORS.warning;
      default:
        return COLORS.info;
    }
  };
  
  const alertColor = getAlertColor(activeAlert.severity);

  return (
    <View style={[styles.overlayContainer, { backgroundColor: alertColor }]}>
      <MaterialCommunityIcons name="alert-decagram" size={24} color="#fff" style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>ALERT: {activeAlert.severity?.toUpperCase()}</Text>
        <Text style={styles.message}>
          {activeAlert.athleteName || 'Unknown Athlete'} - {activeAlert.magnitude.toFixed(1)}g impact detected
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleAcknowledge}>
          <Text style={styles.buttonText}>Acknowledge</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.detailsButton]} onPress={handleViewDetails}>
          <Text style={styles.buttonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 10, // Adjust for status bar
    left: 10,
    right: 10,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000, // Ensure it's on top
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  message: {
    color: '#fff',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  button: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4, // Space buttons vertically
  },
  detailsButton: {
    backgroundColor: 'rgba(255,255,255,0.3)', // Slightly different
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AlertOverlay; 