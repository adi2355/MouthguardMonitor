import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TouchableOpacity,
  Animated
} from 'react-native';
import LineChart from './LineChart';
import { COLORS } from '../../../src/constants';
import { ChartData } from '../../../src/types';

// Constants with more descriptive time range labels
const TIME_RANGES = [
  { id: '1h', label: 'Recent' },
  { id: '3h', label: 'Short' },
  { id: '12h', label: 'Medium' },
  { id: '1d', label: 'Long' },
  { id: '1w', label: 'All' }
];
const chartWidth = 1500; // Make chart scrollable with larger width

interface HeartRateDataPoint {
  value: number;
  timestamp: number;
}

interface ScrollableHeartRateChartProps {
  data: ChartData;
  height?: number;
  currentValue?: number;
  timestamp?: string;
  rangeData?: {
    min: number;
    max: number;
    timeRange: string;
  };
}

const ScrollableHeartRateChart: React.FC<ScrollableHeartRateChartProps> = ({
  data,
  height = 300,
  currentValue,
  timestamp,
  rangeData
}) => {
  // State for selected time range
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('12h');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Start animation when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Check if we have valid data to display
  const hasValidData = data && 
                     data.datasets && 
                     Array.isArray(data.datasets) && 
                     data.datasets.length > 0 &&
                     data.datasets[0].data &&
                     data.datasets[0].data.length > 0;
  
  // Calculate min/max heart rate values from dataset if not provided
  const derivedRangeData = rangeData || (hasValidData ? {
    min: Math.min(...data.datasets[0].data),
    max: Math.max(...data.datasets[0].data),
    timeRange: "Today"
  } : { min: 0, max: 0, timeRange: "No data available" });
  
  // Calculate current value if not provided
  const derivedCurrentValue = currentValue || (hasValidData ? data.datasets[0].data[data.datasets[0].data.length - 1] : 0);
  
  // Get current timestamp if not provided
  const derivedTimestamp = timestamp || (hasValidData ? data.labels[data.labels.length - 1] : "--:--");

  // Check if all timestamps are the same (a common issue with the data)
  const allTimestampsSame = hasValidData && 
    data.labels.every((label, _, arr) => label === arr[0]);
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    if (!hasValidData) {
      return {
        labels: [],
        datasets: [{
          data: [],
          color: (opacity = 1) => `rgba(255, 69, 58, ${opacity * 0.8})`,
          strokeWidth: 2
        }]
      };
    }
    
    // Determine the percentage of data to show based on time range
    let percentToShow: number;
    
    switch(selectedTimeRange) {
      case '1h': 
        percentToShow = 0.1; // Show 10% of the data for 1h
        break;
      case '3h': 
        percentToShow = 0.25; // Show 25% of the data for 3h
        break; 
      case '12h': 
        percentToShow = 0.5; // Show 50% of the data for 12h
        break;
      case '1d': 
        percentToShow = 0.75; // Show 75% of the data for 1d
        break;
      case '1w': 
        percentToShow = 1; // Show all data for 1w
        break;
      default: 
        percentToShow = 0.5; // Default to 50%
    }
    
    // Calculate how many data points to include
    const totalPoints = data.datasets[0].data.length;
    const pointsToInclude = Math.max(Math.round(totalPoints * percentToShow), 2); // At least 2 points
    
    // Get the most recent data based on percentage
    const startIndex = Math.max(0, totalPoints - pointsToInclude);
    
    // Create filtered dataset
    const filteredData = {
      labels: data.labels.slice(startIndex),
      datasets: [{
        ...data.datasets[0],
        data: data.datasets[0].data.slice(startIndex)
      }]
    };
    
    // Generate more meaningful labels if all timestamps are the same
    if (allTimestampsSame) {
      const filteredLength = filteredData.labels.length;
      const now = new Date();
      
      // Create time labels based on relative position
      filteredData.labels = filteredData.labels.map((_, index) => {
        // For equally spaced time labels
        if (index === 0) return "Start";
        if (index === filteredLength - 1) return "Now";
        
        // For selected points in the middle
        if (
          index === Math.floor(filteredLength * 0.25) || 
          index === Math.floor(filteredLength * 0.5) || 
          index === Math.floor(filteredLength * 0.75)
        ) {
          return `${Math.round((index / filteredLength) * 100)}%`;
        }
        
        return "";
      });
    } else {
      // Determine appropriate label spacing for regular timestamps
      const filteredLength = filteredData.labels.length;
      
      // Adjust label step based on amount of data
      let labelStep: number;
      
      if (filteredLength > 30) {
        labelStep = Math.max(1, Math.floor(filteredLength / 6));
      } else if (filteredLength > 15) {
        labelStep = Math.max(1, Math.floor(filteredLength / 4));
      } else {
        labelStep = 1; // Show all labels for small datasets
      }
      
      // Create sparse labels with empty strings for non-shown labels
      filteredData.labels = filteredData.labels.map((label, index) => 
        index % labelStep === 0 ? label : ""
      );
    }
    
    return filteredData;
  };
  
  // Calculate average heart rate from filtered data
  const getAverageHeartRate = () => {
    if (!hasValidData) return 0;
    
    // Get currently filtered data
    const filteredDataset = getFilteredData().datasets[0].data;
    
    // Calculate average
    const sum = filteredDataset.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / filteredDataset.length);
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {/* Time range selector */}
      <View style={styles.timeRangeSelector}>
        {TIME_RANGES.map((range) => (
          <Pressable
            key={range.id}
            style={[
              styles.timeRangeButton,
              selectedTimeRange === range.id && styles.selectedTimeRange
            ]}
            onPress={() => setSelectedTimeRange(range.id)}
          >
            <Text 
              style={[
                styles.timeRangeText,
                selectedTimeRange === range.id && styles.selectedTimeRangeText
              ]}
            >
              {range.label}
            </Text>
          </Pressable>
        ))}
      </View>
      
      {/* Range information */}
      <View style={styles.rangeInfo}>
        <View style={styles.rangeRow}>
          <View>
            <Text style={styles.rangeTitle}>RANGE</Text>
            <Text style={styles.rangeValue}>
              {derivedRangeData.min}–{derivedRangeData.max} <Text style={styles.rangeUnit}>BPM</Text>
            </Text>
          </View>
          <View style={styles.averageContainer}>
            <Text style={styles.avgTitle}>AVG</Text>
            <Text style={styles.avgValue}>{getAverageHeartRate()} <Text style={styles.rangeUnit}>BPM</Text></Text>
          </View>
        </View>
        <Text style={styles.dateRange}>{derivedRangeData.timeRange}</Text>
      </View>
      
      {/* Scrollable chart */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
        style={styles.scrollView}
        decelerationRate="normal"
      >
        {hasValidData ? (
          <LineChart
            data={getFilteredData()}
            width={chartWidth}
            height={height}
            bezier={true}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 69, 58, ${opacity * 0.8})`,
              labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity * 0.6})`,
              style: {
                borderRadius: 0,
              },
              propsForDots: {
                r: "3",
                strokeWidth: "0",
                stroke: "transparent",
                fill: "rgba(255, 69, 58, 0.8)",
              },
              propsForBackgroundLines: {
                strokeDasharray: '5, 5',
                strokeWidth: 0.5,
                stroke: 'rgba(150, 150, 150, 0.15)',
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 0,
            }}
          />
        ) : (
          <View style={[styles.emptyChart, { width: chartWidth, height }]}>
            <Text style={styles.emptyChartText}>No heart rate data available</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Current value indicator */}
      <View style={styles.currentValueContainer}>
        <Text style={styles.currentValueLabel}>Latest: {derivedTimestamp}</Text>
        <Text style={styles.currentValue}>{derivedCurrentValue} BPM</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedTimeRange: {
    backgroundColor: '#2C2C2E',
  },
  timeRangeText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedTimeRangeText: {
    color: '#FFFFFF',
  },
  rangeInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rangeTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  rangeValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 2,
  },
  rangeUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8E8E93',
  },
  dateRange: {
    color: '#8E8E93',
    fontSize: 16,
    marginBottom: 16,
  },
  averageContainer: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  avgTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  avgValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  scrollView: {
    marginTop: 8,
  },
  currentValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF453A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 16,
  },
  currentValueLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
  currentValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: '#8E8E93',
    fontSize: 16,
  }
});

export default ScrollableHeartRateChart; 