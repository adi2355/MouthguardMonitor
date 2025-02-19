import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Datapoint } from '@/src/types';

const windowWidth = Dimensions.get('window').width;

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
    return (
        <TouchableOpacity style={styles.dailyAverageCard} onPress={onPress}>
            <View style={styles.dailyAverageHeader}>
                <MaterialCommunityIcons name="clock-outline" size={24} color="#007AFF" />
                <Text style={styles.dailyAverageTitle}>Daily Average</Text>
            </View>
            
            <Text style={styles.dailyAverageDescription}>
                On average, your daily hits were more than usual this week.
            </Text>

            <View style={styles.statsRow}>
                <Text style={styles.statValue}>{averageHits || 0}</Text>
                <Text style={styles.statUnit}>hits per day</Text>
            </View>

            {data && data.length > 0 && (
                <View style={styles.chartWrapper}>
                    <LineChart
                        data={{
                            labels: data.map(d => d.label),
                            datasets: [{
                                data: data.map(d => d.value),
                                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                                strokeWidth: 2
                            }]
                        }}
                        width={windowWidth - 64}
                        height={100}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                            labelColor: (opacity = 0.5) => `rgba(128, 128, 128, ${opacity})`,
                            propsForDots: {
                                r: "3",
                                strokeWidth: "1",
                                stroke: "#007AFF",
                                fill: '#ffffff'
                            },
                            propsForBackgroundLines: {
                                stroke: "#e3e3e3",
                                strokeWidth: 1
                            },
                        }}
                        bezier
                        withInnerLines={true}
                        withOuterLines={true}
                        withVerticalLines={true}
                        withHorizontalLines={true}
                        withVerticalLabels={false}
                        withHorizontalLabels={false}
                        style={styles.chart}
                    />
                </View>
            )}

            <View style={styles.moreDetailsRow}>
                <Text style={styles.moreDetailsText}>More details...</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#007AFF" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    dailyAverageCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    dailyAverageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dailyAverageTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginLeft: 8,
        color: '#007AFF',
    },
    dailyAverageDescription: {
        fontSize: 17,
        color: '#000',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    statValue: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#000',
    },
    statUnit: {
        fontSize: 17,
        color: '#666',
        marginLeft: 4,
    },
    chartWrapper: {
        marginHorizontal: -16,
        marginBottom: 16,
        paddingVertical: 8,
    },
    chart: {
        marginRight: 16,
    },
    moreDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
    },
    moreDetailsText: {
        fontSize: 17,
        color: '#007AFF',
    },
}); 