import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    // Add validation checks
    if (!Array.isArray(weeklyData) || weeklyData.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>No data available</Text>
            </View>
        );
    }

    // Ensure safe value calculation
    const safeValues = weeklyData.map(item => Math.max(0, Number(item.value) || 0));
    const maxValue = Math.max(...safeValues, 1); // Use 1 as minimum to avoid division by zero
    
    const renderPercentageChange = () => {
        if (percentageChange === 0) return null;
        
        const isIncrease = percentageChange > 0;
        const color = isIncrease ? '#FF3B30' : '#34C759';
        
        return (
            <View style={styles.changeContainer}>
                <Text style={[styles.changeText, { color }]}>
                    {isIncrease ? '↑' : '↓'} {Math.abs(Math.round(percentageChange))}% from last week
                </Text>
            </View>
        );
    };

    return (
        <TouchableOpacity 
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.headerContainer}>
                <View style={styles.titleContainer}>
                    <MaterialCommunityIcons 
                        name="clock-outline" 
                        size={24} 
                        color="#8E8E93" 
                    />
                    <Text style={styles.title}>Daily Average</Text>
                </View>
                {renderPercentageChange()}
            </View>
            
            <View style={styles.averageContainer}>
                <Text style={styles.averageValue}>
                    {Math.round(average)} <Text style={styles.hitText}>hits</Text>
                </Text>
            </View>

            <View style={styles.chartContainer}>
                {weeklyData.map((day, index) => {
                    // Ensure safe value and calculate height
                    const value = Math.max(0, Number(day.value) || 0);
                    const heightPercentage = Math.min((value / maxValue) * 100, 100);
                    const barHeight = Math.max((heightPercentage * 150) / 100, 4);

                    return (
                        <View key={index} style={styles.barWrapper}>
                            <View style={styles.barContainer}>
                                <View 
                                    style={[
                                        styles.bar, 
                                        { height: barHeight }
                                    ]} 
                                />
                            </View>
                            <Text style={styles.dayLabel}>{day.label || ''}</Text>
                        </View>
                    );
                })}
                {average > 0 && maxValue > 0 && (
                    <View style={[
                        styles.averageLine,
                        { 
                            bottom: Math.max(
                                Math.min((average / maxValue) * 150, 150),
                                0
                            )
                        }
                    ]} />
                )}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>See All Activity</Text>
                <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={24} 
                    color="#007AFF" 
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#8E8E93',
        marginLeft: 8,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    changeText: {
        fontSize: 15,
        fontWeight: '500',
    },
    averageContainer: {
        marginVertical: 12,
    },
    averageValue: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#000',
    },
    hitText: {
        fontSize: 17,
        fontWeight: 'normal',
        color: '#8E8E93',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 180,
        marginBottom: 8,
        position: 'relative',
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    barContainer: {
        width: 30,
        height: 150,
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 4,
        backgroundColor: '#4CC9F0',
    },
    dayLabel: {
        marginTop: 8,
        fontSize: 12,
        color: '#8E8E93',
    },
    averageLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#34C759',
    },
    footer: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 17,
        color: '#007AFF',
    },
});

export default WeeklyUsageBanner;