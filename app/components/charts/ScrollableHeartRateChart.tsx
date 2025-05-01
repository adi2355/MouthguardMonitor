import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import LineChart from './LineChart';
import { COLORS } from '../../../src/constants';
import { ChartData } from '../../../src/types';

// Constants with more descriptive time range labels
const TIME_RANGES = [
  { id: '3h', label: 'Short' },
  { id: '1w', label: 'All' }
];
const chartWidth = 1500; // Make chart scrollable with larger width
const screenWidth = Dimensions.get('window').width;

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

const ScrollableHeartRateChart: React.FC<ScrollableHeartRateChartProps> = React.memo(({
  data,
  height = 300,
  currentValue,
  timestamp,
  rangeData
}) => {
  // State for selected time range - default to Short (3h) instead of 12h
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('3h');
  // Reference to the scroll view to scroll to end (newest data) on mount
  const scrollViewRef = useRef<ScrollView>(null);
  
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
    
    // Scroll to the right end (newest data) after a short delay to ensure rendering is complete
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: false });
      }
    }, 100);
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
    min: Math.min(...data.datasets[0].data.filter(val => !isNaN(val))),
    max: Math.max(...data.datasets[0].data.filter(val => !isNaN(val))),
    timeRange: "Today"
  } : { min: 0, max: 0, timeRange: "No data available" });
  
  // Calculate current value if not provided
  const derivedCurrentValue = currentValue || (hasValidData ? 
    (isNaN(data.datasets[0].data[data.datasets[0].data.length - 1]) ? 
      0 : data.datasets[0].data[data.datasets[0].data.length - 1]) : 0);
  
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
      case '3h': 
        percentToShow = 0.25; // Show 25% of the data for 3h
        break; 
      case '1w':
      default: 
        percentToShow = 1; // Show all data for 1w
        break;
    }
    
    // Calculate how many data points to include
    const totalPoints = data.datasets[0].data.length;
    const pointsToInclude = Math.max(Math.round(totalPoints * percentToShow), 2); // At least 2 points
    
    // Get the most recent data based on percentage
    const startIndex = Math.max(0, totalPoints - pointsToInclude);
    
    // Create filtered dataset with NaN check
    const filteredData = {
      labels: data.labels.slice(startIndex),
      datasets: [{
        ...data.datasets[0],
        data: data.datasets[0].data.slice(startIndex).map(val => isNaN(val) ? 0 : val) // Add NaN check
      }]
    };
    
    // Generate more meaningful labels if all timestamps are the same
    if (allTimestampsSame) {
      const filteredLength = filteredData.labels.length;
      
      // Create time labels based on relative position - reversed to show newest data on right
      filteredData.labels = filteredData.labels.map((_, index) => {
        const reversedIndex = filteredLength - index - 1;
        // For equally spaced time labels
        if (reversedIndex === 0) return "Now";
        if (reversedIndex === filteredLength - 1) return "Start";
        
        // For selected points in the middle
        if (
          reversedIndex === Math.floor(filteredLength * 0.25) || 
          reversedIndex === Math.floor(filteredLength * 0.5) || 
          reversedIndex === Math.floor(filteredLength * 0.75)
        ) {
          return `${Math.round(((filteredLength - reversedIndex) / filteredLength) * 100)}%`;
        }
        
        return "";
      });
      
      // Reverse the data array to show newest data on right with NaN checks
      filteredData.datasets[0].data = [...filteredData.datasets[0].data].reverse().map(val => isNaN(val) ? 0 : val);
      filteredData.labels = [...filteredData.labels].reverse();
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
      // We'll reverse them to show newest on right
      const tempLabels = filteredData.labels.map((label, index) => 
        index % labelStep === 0 ? label : ""
      );
      
      // Reverse data and labels to show newest data on right with NaN checks
      filteredData.datasets[0].data = [...filteredData.datasets[0].data].reverse().map(val => isNaN(val) ? 0 : val);
      filteredData.labels = [...tempLabels].reverse();
    }
    
    return filteredData;
  };
  
  // Calculate average heart rate from filtered data with NaN protection
  const getAverageHeartRate = () => {
    if (!hasValidData) return 0;
    
    // Get currently filtered data (before reversal to ensure we're using the right data)
    const totalPoints = data.datasets[0].data.length;
    const percentToShow = selectedTimeRange === '3h' ? 0.25 : 1;
    
    const pointsToInclude = Math.max(Math.round(totalPoints * percentToShow), 2);
    const startIndex = Math.max(0, totalPoints - pointsToInclude);
    
    // Get filtered data with NaN check
    const filteredDataset = data.datasets[0].data.slice(startIndex).filter(val => !isNaN(val));
    
    // Calculate average with protection against empty array
    if (filteredDataset.length === 0) return 0;
    
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
      
      {/* Chart container with fixed range info and scrollable chart */}
      <View style={styles.chartContainer}>
        {/* Static range information - always visible */}
        <View style={styles.staticRangeContainer}>
          <View>
            <Text style={styles.rangeTitle}>RANGE</Text>
            <Text style={styles.rangeValue}>
              {derivedRangeData.min}–{derivedRangeData.max} <Text style={styles.rangeUnit}>BPM</Text>
            </Text>
            <Text style={styles.dateRange}>{derivedRangeData.timeRange}</Text>
          </View>
          <View style={styles.averageContainer}>
            <Text style={styles.avgTitle}>AVG</Text>
            <Text style={styles.avgValue}>{getAverageHeartRate()} <Text style={styles.rangeUnit}>BPM</Text></Text>
          </View>
        </View>
        
        {/* Scrollable chart area */}
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          style={styles.scrollView}
          decelerationRate="normal"
        >
          {hasValidData ? (
            <LineChart
              data={getFilteredData()}
              width={chartWidth}
              height={height - 120} // Further reduce height to account for static range display
              bezier={true}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 69, 58, 1)`, // Full opacity for the line
                labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity * 0.6})`,
                style: {
                  borderRadius: 0,
                },
                propsForDots: {
                  r: "3",
                  strokeWidth: "0",
                  stroke: "transparent",
                  fill: "rgba(255, 69, 58, 1)", // Full opacity for dots
                },
                propsForBackgroundLines: {
                  strokeDasharray: '5, 5',
                  strokeWidth: 0.5,
                  stroke: 'rgba(150, 150, 150, 0.15)',
                },
                strokeWidth: 2, // Thinner line
                fillShadowGradient: 'rgba(255, 69, 58, 0.4)', // Semi-transparent gradient fill
                fillShadowGradientOpacity: 0.3, // Reduced opacity for the fill
              }}
              style={{
                marginVertical: 6, // Less vertical margin
                borderRadius: 0,
              }}
            />
          ) : (
            <View style={[styles.emptyChart, { width: chartWidth, height: height - 120 }]}>
              <Text style={styles.emptyChartText}>No heart rate data available</Text>
            </View>
          )}
        </ScrollView>
      </View>
      
      {/* Current value indicator */}
      <View style={[
        styles.currentValueContainer, 
        { backgroundColor: derivedCurrentValue > 100 ? '#FF453A' : '#34C759' }
      ]}>
        <Text style={styles.currentValueLabel}>Latest {derivedTimestamp}</Text>
        <Text style={styles.currentValue}>{derivedCurrentValue} BPM</Text>
      </View>
    </Animated.View>
  );
});

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
    paddingHorizontal: 8, // Added padding to prevent overflowing
  },
  timeRangeButton: {
    paddingHorizontal: 12, // Reduced horizontal padding
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1, // Make buttons flex to fit container
    alignItems: 'center', // Center text within button
    marginHorizontal: 2, // Add spacing between buttons
  },
  selectedTimeRange: {
    backgroundColor: '#2C2C2E',
  },
  timeRangeText: {
    color: '#8E8E93',
    fontSize: 15, // Slightly smaller font size
    fontWeight: '500',
  },
  selectedTimeRangeText: {
    color: '#FFFFFF',
  },
  chartContainer: {
    position: 'relative',
    height: 220, // Reduced height for chart area
  },
  staticRangeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
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
    marginBottom: 4,
  },
  rangeValue: {
    color: '#FFFFFF',
    fontSize: 28, // Smaller font size
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
    fontSize: 14, // Smaller font size
    marginBottom: 8, // Reduced margin
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
    marginTop: 72, // Reduced space for the static range display
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  currentValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.warning, // Default to warning color
    paddingHorizontal: 20,
    paddingVertical: 12, // Reduced padding
  },
  currentValueLabel: {
    color: '#FFFFFF',
    fontSize: 13, // Smaller font
    fontWeight: '500',
    opacity: 0.9,
  },
  currentValue: {
    fontSize: 16, // Smaller font
    fontWeight: '600',
    opacity: 0.9,
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