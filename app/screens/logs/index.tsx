import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants';

import LogsScreen from '../LogsScreen';

export default function LogsScreenWrapper() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Data Logs",
          headerShown: true,
        }}
      />
      <LogsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  }
}); 