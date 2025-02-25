import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../src/constants';

export default function WeeklyAverage() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, padding: 20 }}>
      <Text style={{ color: COLORS.text.primary, fontSize: 18 }}>
        Weekly Average
      </Text>
    </View>
  );
}