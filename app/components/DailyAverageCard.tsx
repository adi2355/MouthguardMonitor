import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { COLORS } from "@/src/constants";
import { ChartDataPoint } from "@/src/types";

interface DailyAverageCardProps {
  data: ChartDataPoint[];
  averageHits: number;
  onPress: () => void;
}

export default function DailyAverageCard({ data, averageHits, onPress }: DailyAverageCardProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="chart-timeline-variant" 
            size={24} 
            color={COLORS.primary}
          />
          <Text style={styles.headerText}>Daily Average</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.averageValue}>{averageHits.toFixed(1)}</Text>
          <Text style={styles.averageLabel}>hits per day</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  content: {
    alignItems: 'center',
  },
  averageValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  averageLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
}); 