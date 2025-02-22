import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/src/constants';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
}); 