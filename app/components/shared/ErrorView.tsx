import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from '@/src/constants';

interface ErrorViewProps {
  error: string;
}

export default function ErrorView({ error }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name="alert-circle-outline" 
        size={48} 
        color={COLORS.error} 
      />
      <Text style={styles.title}>Error</Text>
      <Text style={styles.message}>{error}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  message: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
  },
});