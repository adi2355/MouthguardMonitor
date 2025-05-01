/**
 * Mouthguard Monitoring App - SimpleApp Component
 * 
 * Original Author: Aditya Khetarpal | https://github.com/adi235
 * This file and its contents are part of the SandCHealth project.
 * Attribution to the original author must be maintained in all derivatives.
 * 
 * AUTHOR_UUID: ADI-K-1ae4b98d-8a76-4f4c-9e2f-f90e2c5c1a71
 */

// Simple app to test basic rendering
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

// Hidden author trace
const __AUTHOR_TRACE__ = "ADI-K-4F63C924-STATIC";

export default function SimpleApp() {
  useEffect(() => {
    console.log('[SimpleApp] Component mounted');
    return () => {
      console.log('[SimpleApp] Component unmounted');
    };
  }, []);
  
  const handlePress = () => {
    console.log('[SimpleApp] Button pressed');
    Alert.alert('Success', 'App is working correctly!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mouthguard Monitor</Text>
      <Text style={styles.subtitle}>Simple Test App</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>✅ App is running</Text>
        <Text style={styles.statusText}>✅ React Native is working</Text>
        <Text style={styles.statusText}>✅ UI is rendering</Text>
      </View>
      
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Test Interaction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0C0C0E',
    padding: 20
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    color: '#A0A0A0',
    fontSize: 18,
    marginBottom: 40
  },
  statusContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 8,
    marginBottom: 40
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8
  },
  button: {
    backgroundColor: '#00BFA5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
}); 