import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openDatabaseAsync } from 'expo-sqlite';
import { BONG_HITS_DATABASE_NAME } from '@/src/constants';
import { useRouter } from 'expo-router';

const windowWidth = Dimensions.get('window').width;

const TimeRangeSelector = ({ selectedRange, onRangeChange }) => {
    const ranges = ['H', 'D', 'W', 'M', '6M', 'Y'];
    
    return (
        <View style={styles.timeSelector}>
            {ranges.map((range) => (
                <TouchableOpacity
                    key={range}
                    onPress={() => onRangeChange(range)}
                    style={[
                        styles.timeSelectorButton,
                        selectedRange === range && styles.timeSelectorButtonSelected
                    ]}
                >
                    <Text style={[
                        styles.timeSelectorText,
                        selectedRange === range && styles.timeSelectorTextSelected
                    ]}>
                        {range}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const InfoCard = ({ icon, title, description, value, period, showArrow = true }) => (
    <TouchableOpacity style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
            {icon}
            <Text style={styles.infoCardTitle}>{title}</Text>
        </View>
        <Text style={styles.infoCardDescription}>{description}</Text>
        {value && period && (
            <View style={styles.monthComparison}>
                <View style={styles.monthValue}>
                    <Text style={styles.valueText}>{value}</Text>
                    <Text style={styles.unitText}>s</Text>
                </View>
                <View style={[styles.periodBar, { backgroundColor: '#007AFF' }]}>
                    <Text style={styles.periodText}>{period}</Text>
                </View>
            </View>
        )}
        {showArrow && (
            <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color="#C7C7CC" 
                style={styles.arrowIcon}
            />
        )}
    </TouchableOpacity>
);

export default function DailyAverageOverview() {
    const router = useRouter();
    const [selectedRange, setSelectedRange] = useState('H');
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{
            data: [0],
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            strokeWidth: 2
        }]
    });
    const [averageDuration, setAverageDuration] = useState(0);
    const [hitCount, setHitCount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            try {
                const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
                let query = '';
                
                // Different queries based on time range
                switch(selectedRange) {
                    case 'H':
                        query = `
                            SELECT 
                                strftime('%H:%M', timestamp) as time_label,
                                AVG(duration_ms)/1000 as avg_duration,
                                COUNT(*) as count
                            FROM ${BONG_HITS_DATABASE_NAME}
                            WHERE timestamp >= '2024-12-24'
                            GROUP BY strftime('%H:%M', timestamp)
                            ORDER BY timestamp
                            LIMIT 12;
                        `;
                        break;
                    case 'D':
                        query = `
                            SELECT 
                                strftime('%H:00', timestamp) as time_label,
                                AVG(duration_ms)/1000 as avg_duration,
                                COUNT(*) as count
                            FROM ${BONG_HITS_DATABASE_NAME}
                            WHERE timestamp >= '2024-12-24'
                            GROUP BY strftime('%H', timestamp)
                            ORDER BY time_label;
                        `;
                        break;
                    default:
                        query = `
                            SELECT 
                                strftime('%H:00', timestamp) as time_label,
                                AVG(duration_ms)/1000 as avg_duration,
                                COUNT(*) as count
                            FROM ${BONG_HITS_DATABASE_NAME}
                            WHERE timestamp >= '2024-12-24'
                            GROUP BY strftime('%H', timestamp)
                            ORDER BY time_label;
                        `;
                }

                const result = await db.getAllAsync(query);
                console.log("Query result:", result);

                if (result && result.length > 0) {
                    console.log("Processed data:", result);
                    
                    const timePoints = result.map(r => r.time_label);
                    const durationValues = result.map(r => Math.round(r.avg_duration));
                    
                    // Calculate average duration from the results
                    const totalDuration = result.reduce((acc, curr) => acc + (curr.avg_duration || 0), 0);
                    const avgDuration = Math.round(totalDuration / result.length);
                    setAverageDuration(avgDuration);
                    
                    // Calculate total hits
                    const totalHits = result.reduce((acc, curr) => acc + curr.count, 0);
                    setHitCount(totalHits);

                    // Set chart data
                    setChartData({
                        labels: timePoints,
                        datasets: [{
                            data: durationValues,
                            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                            strokeWidth: 2
                        }]
                    });
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
    }, [selectedRange]);

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        labelColor: (opacity = 0.8) => `rgba(128, 128, 128, ${opacity})`,
        strokeWidth: 2,
        propsForVerticalLabels: {
            fontSize: 10,
            color: '#666666'
        },
        propsForHorizontalLabels: {
            fontSize: 10,
            color: '#666666'
        },
        propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: "#e3e3e3",
            strokeWidth: 1
        },
        yAxisLabel: "",
        yAxisSuffix: "s",
        propsForDots: {
            r: "3",
            strokeWidth: "1",
            stroke: "#007AFF"
        },
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity>
                    <MaterialCommunityIcons name="chevron-left" size={30} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Average</Text>
            </View>

            <View style={styles.content}>
                <TimeRangeSelector
                    selectedRange={selectedRange}
                    onRangeChange={setSelectedRange}
                />

                <View style={styles.exposureSection}>
                    <Text style={styles.exposureLabel}>AVERAGE</Text>
                    <View style={styles.exposureStatus}>
                        <View style={styles.statusIconContainer}>
                            <MaterialCommunityIcons name="clock-outline" size={32} color="#32CD32" />
                        </View>
                        <Text style={styles.statusText}>{averageDuration}s</Text>
                    </View>
                    <Text style={styles.timeText}>Past hour average</Text>
                </View>

                <View style={styles.chartContainer}>
                    <LineChart
                        data={chartData}
                        width={windowWidth - 32}
                        height={180}
                        chartConfig={chartConfig}
                        bezier
                        withVerticalLabels={true}
                        withHorizontalLabels={true}
                        withInnerLines={true}
                        withOuterLines={true}
                        withVerticalLines={true}
                        yAxisInterval={3}
                        segments={3}
                        style={styles.chart}
                    />
                    <View style={styles.yAxisLabels}>
                        <Text style={styles.yAxisText}>30s</Text>
                        <Text style={styles.yAxisText}>20s</Text>
                        <Text style={styles.yAxisText}>10s</Text>
                        <Text style={styles.yAxisText}>0s</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.notificationCard}>
                    <Text style={styles.notificationTitle}>Hit Statistics</Text>
                    <Text style={styles.notificationCount}>{hitCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.showMoreButton}
                    onPress={() => router.push('/dataOverviews/detailedData')}
                >
                    <Text style={styles.showMoreText}>Show More Data</Text>
                </TouchableOpacity>

                <View style={styles.highlightsSection}>
                    <View style={styles.highlightsHeader}>
                        <Text style={styles.highlightsTitle}>Highlights</Text>
                        <TouchableOpacity>
                            <Text style={styles.showAllText}>Show All</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <InfoCard
                        icon={<MaterialCommunityIcons name="clock-outline" size={24} color="#007AFF" />}
                        title="Average Duration"
                        description="On average, your hits this month were shorter than last month."
                        value={averageDuration}
                        period="February"
                    />

                    <InfoCard
                        icon={<MaterialCommunityIcons name="information" size={24} color="#007AFF" />}
                        title="About Daily Average"
                        description="This represents the average duration of your hits measured in seconds. It can be helpful to understand your usage patterns and optimize your experience."
                        showArrow={false}
                    />
                </View>
        </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 8,
        backgroundColor: '#ffffff',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    content: {
        flex: 1,
    },
    timeSelector: {
        flexDirection: 'row',
        backgroundColor: '#e3e3e3',
        margin: 16,
        borderRadius: 8,
        padding: 2,
    },
    timeSelectorButton: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderRadius: 6,
    },
    timeSelectorButtonSelected: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    timeSelectorText: {
        fontSize: 15,
        color: '#666666',
    },
    timeSelectorTextSelected: {
        color: '#007AFF',
        fontWeight: '500',
    },
    exposureSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    exposureLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666666',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    exposureStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusIconContainer: {
        marginRight: 8,
    },
    statusText: {
        fontSize: 34,
        fontWeight: 'bold',
    },
    timeText: {
        fontSize: 15,
        color: '#666666',
    },
    chartContainer: {
        marginHorizontal: 16,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    chart: {
        marginRight: -32,
        marginLeft: -32,
    },
    yAxisLabels: {
        position: 'absolute',
        right: 16,
        top: 16,
        bottom: 16,
        justifyContent: 'space-between',
    },
    yAxisText: {
        fontSize: 10,
        color: '#666666',
    },
    notificationCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    notificationTitle: {
        fontSize: 17,
        fontWeight: '500',
    },
    notificationCount: {
        fontSize: 17,
        fontWeight: '500',
    },
    showMoreButton: {
        alignItems: 'center',
        padding: 16,
    },
    showMoreText: {
        fontSize: 17,
        color: '#007AFF',
    },
    highlightsSection: {
        padding: 16,
    },
    highlightsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    highlightsTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    showAllText: {
        fontSize: 17,
        color: '#007AFF',
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoCardTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 8,
        color: '#007AFF',
    },
    infoCardDescription: {
        fontSize: 17,
        color: '#000000',
        lineHeight: 22,
        marginBottom: 16,
    },
    monthComparison: {
        marginTop: 8,
    },
    monthValue: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    valueText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000000',
    },
    unitText: {
        fontSize: 32,
        color: '#666666',
        marginLeft: 4,
    },
    periodBar: {
        backgroundColor: '#007AFF',
        borderRadius: 6,
        padding: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    periodText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
    },
    arrowIcon: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -12,
    },
});