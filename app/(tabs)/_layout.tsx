import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{title: 'Home'}}
      />
      <Tabs.Screen
        name="mydata"
        options={{title: 'My Data'}}
      />
      <Tabs.Screen
        name="trending"
        options={{title: 'Trending'}}
      />
      <Tabs.Screen
        name="journal"
        options={{title: 'Journal'}}
      />
      <Tabs.Screen
        name="devices"
        options={{title: 'Devices'}}
      />
    </Tabs>
  );
}