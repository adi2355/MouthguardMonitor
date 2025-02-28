import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../src/constants';

export default function AILayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if the user has completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        // Add a small delay to prevent UI jittering
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const hasCompletedOnboarding = await AsyncStorage.getItem('ai_onboarding_completed');
        
        if (hasCompletedOnboarding !== 'true') {
          // Only redirect if we're not already on the onboarding screen
          if (!pathname.includes('/ai/onboarding')) {
            router.replace('/ai/onboarding');
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setError('Failed to check onboarding status');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOnboardingStatus();
  }, [router, pathname]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['rgba(0,230,118,0.1)', 'transparent']}
          style={styles.loadingGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['rgba(255,107,107,0.1)', 'transparent']}
          style={styles.errorGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.errorContent}>
          <MaterialCommunityIcons 
            name="alert-circle-outline" 
            size={48} 
            color="#ff6b6b" 
          />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubtext}>
            Please restart the app or try again later.
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: COLORS.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        },
        headerTintColor: COLORS.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Recommendations',
          tabBarLabel: 'Recommendations',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="leaf" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Assistant',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat-processing" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="journal-insights"
        options={{
          title: 'Journal Insights',
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="onboarding"
        options={{
          href: null, // Hide from tab bar
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  loadingGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
    position: 'relative',
  },
  errorGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  errorContent: {
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    width: '90%',
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  }
});