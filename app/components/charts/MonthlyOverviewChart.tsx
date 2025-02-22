import { Card } from "@/components/Card";
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import { Datapoint } from "@/src/types";
import { useMemo } from "react";

// Using same COLORS object for now
const COLORS = {
  background: '#000000',
  cardBackground: '#1A1A1A',
  primary: '#00E676',
  primaryLight: '#69F0AE',
  primaryDark: '#00C853',
  text: {
    primary: '#FFFFFF',
    secondary: '#FFFFFFCC',
    tertiary: '#FFFFFF99',
  },
  chart: {
    primary: '#00E676',
    secondary: '#69F0AE',
    background: '#1A1A1A',
  },
  gradientColors: {
    start: 'rgba(0,230,118,0.4)',
    middle: 'rgba(105,240,174,0.2)',
    end: 'rgba(0,0,0,0)',
  }
};

const windowWidth = Dimensions.get("window").width;

interface MonthlyOverviewChartProps {
  data: Datapoint[];
  onPress?: () => void;
}

function MonthlyOverviewChart({ data, onPress }: MonthlyOverviewChartProps) {
  // Memoize the chart width calculation
  const chartWidth = useMemo(() => Math.max(windowWidth - 48, 200), [windowWidth]);
  
  // Base chart config with optimizations
  const baseChartConfig = useMemo(() => ({
    backgroundGradientFrom: COLORS.chart.background,
    backgroundGradientTo: COLORS.chart.background,
    color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
    labelColor: () => COLORS.text.tertiary,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    withInnerLines: false,
    withVerticalLabels: true,
    withHorizontalLabels: true,
    withVerticalLines: false,
    withHorizontalLines: true,
    propsForBackgroundLines: {
      stroke: "#e3e3e3",
      strokeWidth: 1,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.primaryLight
    },
    style: {
      borderRadius: 16,
      width: chartWidth,
    },
    formatYLabel: (value: string) => Math.round(Number(value)).toString(),
    formatXLabel: (label: string) => label.substring(0, 3),
    segments: 4,
  }), [chartWidth]);

  // Memoize the chart data transformation
  const chartData = useMemo(() => ({
    labels: data.map((d: Datapoint) => d.label.substring(0, 3)),
    datasets: [{
      data: data.map((d: Datapoint) => d.value),
      color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
      strokeWidth: 2,
    }],
  }), [data]);

  if (!data?.length) {
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="calendar-month" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Monthly Overview</Text>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </Card>
    );
  }

  const content = (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="calendar-month" size={24} color={COLORS.primary} />
        <Text style={styles.cardTitle}>Monthly Overview</Text>
      </View>
      <Text style={styles.cardDescription}>Track your monthly trends</Text>
      <View style={styles.chartContainer}>
        <LinearGradient
          colors={[
            COLORS.gradientColors.start,
            COLORS.gradientColors.middle,
            COLORS.gradientColors.end
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.chartGradient}
        />
        <LineChart
          data={chartData}
          width={chartWidth}
          height={220}
          chartConfig={baseChartConfig}
          bezier
          style={styles.chart}
          withDots={true}
          withShadow={false}
          segments={4}
          fromZero
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          hidePointsAtIndex={[]}
          renderDotContent={({ x, y, index }) => (
            <Text
              key={index}
              style={{
                position: 'absolute',
                top: y - 20,
                left: x - 10,
                fontSize: 10,
                color: COLORS.text.secondary,
              }}
            >
              {chartData.datasets[0].data[index]}
            </Text>
          )}
        />
      </View>
    </Card>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress}>
      {content}
    </TouchableOpacity>
  ) : content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#00E676',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 10,
  },
  cardDescription: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  chartContainer: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.cardBackground,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
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
    fontSize: 16,
    color: COLORS.text.secondary,
    padding: 20,
  }
});

export default MonthlyOverviewChart; 