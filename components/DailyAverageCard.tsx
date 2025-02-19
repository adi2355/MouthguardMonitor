import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Datapoint } from '@/src/types';

const windowWidth = Dimensions.get('window').width;

// Refined colors to match screenshot
const COLORS = {
  background: '#000000',
  cardBackground: '#1A1A1A',
  chartBackground: '#063B24', // Darker green to match screenshot
  primary: '#00E676',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
  },
};

interface DailyAverageCardProps {
    data: Datapoint[];
    averageHits: number;
    onPress: () => void;
}

export const DailyAverageCard: React.FC<DailyAverageCardProps> = ({ 
    data, 
    averageHits, 
    onPress 
}) => {
    // Log data for debugging
    useEffect(() => {
        console.log("Chart data being rendered:", data);
    }, [data]);
    
    // Ensure data is valid and properly formatted
    const validData = React.useMemo(() => {
        if (!data?.length || !data.every(d => typeof d.value === 'number')) {
            return [5, 3, 7, 4, 6, 5]; // Default data if invalid
        }
        return data.map(d => d.value);
    }, [data]);
    
    const chartData = {
        labels: [], // Empty labels since we don't display them
        datasets: [{
            data: validData,
            color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
            strokeWidth: 2
        }]
    };

    return (
        <TouchableOpacity 
          style={styles.dailyAverageCard} 
          onPress={onPress}
          activeOpacity={0.95}
        >
            <View style={styles.cardContent}>
                <View style={styles.dailyAverageHeader}>
                    <MaterialCommunityIcons 
                      name="clock-outline" 
                      size={20} 
                      color={COLORS.primary} 
                      style={styles.headerIcon}
                    />
                    <Text style={styles.dailyAverageTitle}>Daily Average</Text>
                </View>
                
                <Text style={styles.dailyAverageDescription}>
                    On average, your daily hits were more than usual this week.
                </Text>

                <View style={styles.statsContainer}>
                    <Text style={styles.statValue}>{averageHits || 71}</Text>
                    <Text style={styles.statUnit}>hits per day</Text>
                </View>

                <View style={styles.chartContainer}>
                    <LineChart
                        data={chartData}
                        width={windowWidth - 90}
                        height={100}
                        chartConfig={{
                            backgroundColor: 'transparent',
                            backgroundGradientFrom: COLORS.chartBackground,
                            backgroundGradientTo: COLORS.chartBackground,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
                            labelColor: () => 'transparent',
                            propsForDots: {
                                r: "4",
                                strokeWidth: "0",
                                stroke: COLORS.primary,
                                fill: COLORS.primary
                            },
                            propsForBackgroundLines: {
                                stroke: "rgba(255, 255, 255, 0.08)",
                                strokeWidth: 1,
                                strokeDasharray: '5, 5',
                            },
                            fillShadowGradientFrom: 'rgba(0, 230, 118, 0.2)',
                            fillShadowGradientTo: 'rgba(0, 230, 118, 0)',
                        }}
                        bezier
                        withInnerLines={false}
                        withOuterLines={false}
                        withVerticalLines={false}
                        withHorizontalLines={true}
                        withVerticalLabels={false}
                        withHorizontalLabels={false}
                        withShadow={false}
                        style={styles.chart}
                        segments={3}
                        yAxisSuffix=""
                    />
                </View>

                <View style={styles.moreDetailsRow}>
                    <Text style={styles.moreDetailsText}>More details</Text>
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={18} 
                      color={COLORS.primary} 
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    dailyAverageCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 12,
        overflow: 'hidden',
        borderWidth: 0,
    },
    cardContent: {
        padding: 16,
    },
    dailyAverageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerIcon: {
        marginRight: 8,
    },
    dailyAverageTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
        letterSpacing: 0.3,
    },
    dailyAverageDescription: {
        fontSize: 15,
        color: COLORS.text.secondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    statsContainer: {
        marginBottom: 16,
    },
    statValue: {
        fontSize: 40,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: -0.5,
        lineHeight: 46,
    },
    statUnit: {
        fontSize: 15,
        color: COLORS.text.tertiary,
    },
    chartContainer: {
        height: 110,
        backgroundColor: COLORS.chartBackground,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        marginTop: 8,
        paddingVertical: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chart: {
        paddingRight: 10,
        paddingLeft: 10,
        borderRadius: 12,
    },
    moreDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    moreDetailsText: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: '500',
    },
});