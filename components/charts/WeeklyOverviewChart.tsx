import { Card } from "@/components/Card";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import { Datapoint } from "@/src/types";
import { useMemo } from "react";
import { COLORS } from "@/src/constants"; // Import the centralized color palette

const windowWidth = Dimensions.get("window").width;

interface WeeklyOverviewChartProps {
  data: Datapoint[];
  onPress?: () => void;
}

export function WeeklyOverviewChart({ data }: WeeklyOverviewChartProps) {
  // Memoize the chart width calculation
  const chartWidth = useMemo(() => Math.max(windowWidth - 64, 200), [windowWidth]);

  // Base chart config with optimizations
  const baseChartConfig = useMemo(() => ({
    backgroundColor: COLORS.background,
    backgroundGradientFrom: COLORS.background,
    backgroundGradientTo: COLORS.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 84, 50, ${opacity})`, // Primary color converted to rgba
    labelColor: (opacity = 0.8) => `rgba(79, 96, 105, ${opacity})`, // textSecondary
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    withInnerLines: false,
    withVerticalLabels: true,
    withHorizontalLabels: true,
    withVerticalLines: false,
    withHorizontalLines: true,
    propsForBackgroundLines: {
      stroke: COLORS.borderLight,
      strokeWidth: 1,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.primary,
    },
    style: {
      borderRadius: 16,
    },
    formatYLabel: (value: string) => Math.round(Number(value)).toString(),
    formatXLabel: (label: string) => label.substring(0, 3),
    segments: 4,
  }), []);

  // Memoize the data transformation
  const chartData = useMemo(() => ({
    labels: data.map((d) => d.label),
    datasets: [{ 
      data: data.map((d) => d.value),
      color: (opacity = 1) => `rgba(0, 84, 50, ${opacity})`, // Primary color converted to rgba
      strokeWidth: 2,
    }]
  }), [data]);

  if (!data?.length) {
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="calendar-week" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Weekly Overview</Text>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="calendar-week" size={24} color={COLORS.primary} />
        <Text style={styles.cardTitle}>Weekly Overview</Text>
      </View>
      <Text style={styles.cardDescription}>Compare your usage across different days</Text>
      <View style={styles.chartContainer}>
        <LinearGradient
          colors={[
            `${COLORS.primary}33`, // ~20% opacity 
            `${COLORS.primary}19`, // ~10% opacity
            `${COLORS.background}00` // transparent
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.chartGradient}
        />
        <BarChart
          data={chartData}
          width={chartWidth}
          height={180}
          chartConfig={baseChartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
          segments={4}
          flatColor={true}
          withCustomBarColorFromData={true}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  cardDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  chartContainer: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  chartGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  noDataText: {
    color: COLORS.textTertiary,
    fontSize: 16,
    marginVertical: 40,
    fontStyle: 'italic',
  }
}); 