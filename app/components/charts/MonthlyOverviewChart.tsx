import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import { ChartDataPoint } from '@/src/types';

interface MonthlyOverviewChartProps {
  data: ChartDataPoint[];
  onPress?: () => void;
}

const MonthlyOverviewChart: React.FC<MonthlyOverviewChartProps> = ({ data, onPress }) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [{
      data: data.map(item => item.value)
    }]
  };

  // Calculate monthly stats
  const totalHits = data.reduce((sum, month) => sum + month.value, 0);
  const avgHits = totalHits / data.length;
  const maxHits = Math.max(...data.map(month => month.value));
  const maxMonth = data.find(month => month.value === maxHits)?.label || '';
  const monthlyGrowth = data.length > 1 
    ? ((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(1)
    : '0';

  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      <TouchableOpacity 
        onPress={onPress}
        style={styles.touchable}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[
            'rgba(0,230,118,0.15)',
            'rgba(0,230,118,0.05)',
            'transparent'
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Monthly Overview</Text>
              <Text style={styles.subtitle}>
                {avgHits.toFixed(1)} hits/month average
              </Text>
            </View>
            
            <LinearGradient
              colors={['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.1)']}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name="chart-areaspline" 
                size={24} 
                color={COLORS.primary}
              />
            </LinearGradient>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - 80}
              height={180}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: COLORS.primary
                },
                fillShadowGradient: COLORS.primary,
                fillShadowGradientOpacity: 0.2
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
            />
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Hits</Text>
              <Text style={styles.statValue}>{totalHits}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Peak Month</Text>
              <Text style={styles.statValue}>{maxMonth}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Growth</Text>
              <View style={styles.changeContainer}>
                <MaterialCommunityIcons 
                  name={Number(monthlyGrowth) >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={Number(monthlyGrowth) >= 0 ? COLORS.primary : '#FF5252'} 
                />
                <Text style={[
                  styles.changeText,
                  { color: Number(monthlyGrowth) >= 0 ? COLORS.primary : '#FF5252' }
                ]}>
                  {Math.abs(Number(monthlyGrowth))}%
                </Text>
              </View>
            </View>
          </View>

          {/* View More Button */}
          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>View Monthly Analysis</Text>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={20} 
                color="#FFF"
              />
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'rgba(26, 26, 26, 0.8)',
      android: 'rgba(26, 26, 26, 0.95)',
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  touchable: {
    width: '100%',
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    letterSpacing: 0.35,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    letterSpacing: 0.25,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartContainer: {
    marginVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default MonthlyOverviewChart; 