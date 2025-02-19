import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Lighter color constants
const COLORS = {
  background: '#000000',
  cardBackground: '#1A1A1A',
  primary: '#00E676',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
  },
  divider: 'rgba(255, 255, 255, 0.1)',
  increase: '#FF5252',
  decrease: '#00E676',
};

interface WeeklyUsageBannerProps {
    weeklyData: {
        label: string;
        value: number;
    }[];
    average: number;
    percentageChange?: number;
    onPress?: () => void;
}

const WeeklyUsageBanner = ({ 
    weeklyData = [], 
    average = 0, 
    percentageChange = 0,
    onPress 
}: WeeklyUsageBannerProps) => {
    // Use memoization for calculations
    const { safeValues, maxValue, barHeights } = useMemo(() => {
        if (!Array.isArray(weeklyData) || weeklyData.length === 0) {
            return { safeValues: [], maxValue: 1, barHeights: [] };
        }
        
        const validValues = weeklyData.map(item => Math.max(0, Number(item.value) || 0));
        const max = Math.max(...validValues, 1);
        
        // Pre-calculate bar heights
        const heights = validValues.map(value => {
            const heightPercentage = (value / max) * 100;
            return Math.max(Math.min((heightPercentage * 100) / 100, 100), 4);
        });
        
        return { safeValues: validValues, maxValue: max, barHeights: heights };
    }, [weeklyData]);
    
    // Memoize percentage change UI
    const percentageChangeElement = useMemo(() => {
        if (percentageChange === 0) return null;
        
        const isIncrease = percentageChange > 0;
        const color = isIncrease ? COLORS.increase : COLORS.decrease;
        const icon = isIncrease ? "trending-up" : "trending-down";
        
        return (
            <View style={styles.changeContainer}>
                <MaterialCommunityIcons 
                    name={icon} 
                    size={16} 
                    color={color} 
                />
                <Text style={[styles.changeText, { color }]}>
                    {Math.abs(Math.round(percentageChange))}%
                </Text>
            </View>
        );
    }, [percentageChange]);

    // Handle no data case
    if (!Array.isArray(weeklyData) || weeklyData.length === 0) {
        return (
            <TouchableOpacity 
                style={styles.container}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <Text style={styles.noDataText}>No data available</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity 
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.headerContainer}>
                <View style={styles.titleContainer}>
                    <MaterialCommunityIcons 
                        name="chart-timeline-variant" 
                        size={20} 
                        color={COLORS.primary} 
                    />
                    <Text style={styles.title}>Weekly Overview</Text>
                </View>
                {percentageChangeElement}
            </View>
            
            <View style={styles.averageContainer}>
                <View style={styles.averageTextContainer}>
                    <Text style={styles.averageValue}>
                        {Math.round(average)}
                    </Text>
                    <Text style={styles.hitText}>hits per day</Text>
                </View>
                <Text style={styles.comparisonText}>
                    vs last week
                </Text>
            </View>

            <View style={styles.chartContainer}>
                {weeklyData.map((day, index) => {
                    const isHighlighted = safeValues[index] === Math.max(...safeValues);
                    return (
                        <View key={index} style={styles.barWrapper}>
                            <View style={styles.barContainer}>
                                <View
                                    style={[
                                        styles.bar, 
                                        { 
                                            height: barHeights[index],
                                            backgroundColor: isHighlighted ? COLORS.primary : 'rgba(255,255,255,0.2)'
                                        }
                                    ]} 
                                />
                            </View>
                            <Text style={[
                                styles.dayLabel,
                                isHighlighted && styles.dayLabelHighlighted
                            ]}>
                                {day.label || ''}
                            </Text>
                        </View>
                    );
                })}
                
                {average > 0 && maxValue > 0 && (
                    <View style={[
                        styles.averageLine,
                        { 
                            bottom: Math.max(
                                Math.min((average / maxValue) * 100, 100),
                                0
                            ) + 20
                        }
                    ]} />
                )}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>View Details</Text>
                <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={18} 
                    color={COLORS.primary} 
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        margin: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.1)',
    },
    noDataText: {
        color: COLORS.text.secondary,
        fontSize: 16,
        textAlign: 'center',
        padding: 24,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    changeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    averageContainer: {
        marginHorizontal: 16,
        marginBottom: 8,
    },
    averageTextContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    averageValue: {
        fontSize: 36,
        fontWeight: '700',
        color: COLORS.primary,
    },
    hitText: {
        fontSize: 16,
        fontWeight: '400',
        color: COLORS.text.secondary,
        marginLeft: 6,
    },
    comparisonText: {
        fontSize: 14,
        color: COLORS.text.tertiary,
        marginTop: 2,
    },
    chartContainer: {
        paddingHorizontal: 8,
        height: 150,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        position: 'relative',
        marginBottom: 8,
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    barContainer: {
        width: 8,
        justifyContent: 'flex-end',
        height: 100,
    },
    bar: {
        width: '100%',
        borderRadius: 4,
    },
    dayLabel: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.text.tertiary,
        fontWeight: '500',
    },
    dayLabelHighlighted: {
        color: COLORS.text.secondary,
        fontWeight: '600',
    },
    averageLine: {
        position: 'absolute',
        left: 16,
        right: 16,
        height: 1,
        backgroundColor: 'rgba(0, 230, 118, 0.5)',
    },
    footer: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.primary,
    },
});

export default React.memo(WeeklyUsageBanner);