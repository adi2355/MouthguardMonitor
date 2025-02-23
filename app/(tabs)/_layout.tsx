import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="mydata"
        options={{
          title: 'My Data',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-box" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Devices',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="devices" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="notebook" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trending"
        options={{
          title: 'Trending',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="trending-up" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}