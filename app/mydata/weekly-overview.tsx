import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../../src/constants';
import { useDataService } from '../../src/hooks/useDataService';
import LoadingView from '../components/shared/LoadingView';
import ErrorView from '../components/shared/ErrorView';
import BarChart from '../components/charts/BarChart';

export default function WeeklyOverview() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, padding: 20 }}>
      <Text style={{ color: COLORS.text.primary, fontSize: 18 }}>
        Weekly Overview
      </Text>
    </View>
  );
}