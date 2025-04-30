import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 5,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="view-dashboard-outline" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="calendar-clock" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach View',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="clipboard-account-outline" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Athletes & Devices',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="account-group" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="livemonitor"
        options={{
          title: 'Live Monitor',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="monitor-dashboard" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="reportsDetailed"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="chart-timeline-variant" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="cog-outline" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.background,
    borderTopColor: COLORS.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
});