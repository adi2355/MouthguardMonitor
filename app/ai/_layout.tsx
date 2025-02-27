import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Text } from 'react-native';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 }}>
        <Text style={{ color: '#ff6b6b', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
          {error}
        </Text>
        <Text style={{ color: '#ffffff', fontSize: 14, textAlign: 'center' }}>
          Please restart the app or try again later.
        </Text>
      </View>
    );
  }
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4a7c59',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#333',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#fff',
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