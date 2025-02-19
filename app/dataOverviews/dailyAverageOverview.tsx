import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from "react-native";
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openDatabaseAsync } from 'expo-sqlite';
import { BONG_HITS_DATABASE_NAME } from '@/src/constants';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const windowWidth = Dimensions.get('window').width;

// Color constants to match your theme
const COLORS = {
  background: '#000000',
  cardBackground: '#1A1A1A',
  chartBackground: '#063B24',
  primary: '#00E676',
  primaryLight: '#69F0AE',
  primaryDark: '#00C853',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    quaternary: 'rgba(255, 255, 255, 0.4)',
  },
  divider: 'rgba(255, 255, 255, 0.1)',
  chart: {
    grid: 'rgba(255, 255, 255, 0.08)',
  }
};

interface TimeRangeSelectorProps {
    selectedRange: string;
    onRangeChange: (range: string) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ selectedRange, onRangeChange }) => {
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

interface InfoCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    value?: number;
    period?: string;
    showArrow?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ 
    icon, 
    title, 
    description, 
    value, 
    period, 
    showArrow = true 
}) => (
    <View style={styles.infoCard}>
        <LinearGradient
            colors={['rgba(0,230,118,0.1)', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
        />
        <View style={styles.infoCardContent}>
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
                    <View style={[styles.periodBar, { backgroundColor: COLORS.primary }]}>
                        <Text style={styles.periodText}>{period}</Text>
                    </View>
                </View>
            )}
            {showArrow && (
                <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={20} 
                    color={COLORS.text.quaternary} 
                    style={styles.arrowIcon}
                />
            )}
        </View>
    </View>
);

interface QueryResult {
    time_label: string;
    avg_duration: number;
    count: number;
}

export default function DailyAverageOverview() {
    const router = useRouter();
    const [selectedRange, setSelectedRange] = useState('H');
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{
            data: [0],
            color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
            strokeWidth: 2
        }]
    });
    const [averageDuration, setAverageDuration] = useState(0);
    const [hitCount, setHitCount] = useState(0);

    const loadData = async () => {
        try {
            const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
            let query = '';
            let timeDescription = '';
            
            // Use fixed date for test data
            const testDate = '2024-12-24';
            
            switch(selectedRange) {
                case 'H':
                    query = `
                        SELECT 
                            strftime('%H:%M', timestamp) as time_label,
                            ROUND(AVG(duration_ms)/1000, 1) as avg_duration,
                            COUNT(*) as count
                        FROM ${BONG_HITS_DATABASE_NAME}
                        WHERE timestamp >= '${testDate}'
                        GROUP BY strftime('%H:%M', timestamp)
                        ORDER BY timestamp
                        LIMIT 12;
                    `;
                    timeDescription = 'Past hour';
                    break;
                case 'D':
                    query = `
                        SELECT 
                            strftime('%H:00', timestamp) as time_label,
                            ROUND(AVG(duration_ms)/1000, 1) as avg_duration,
                            COUNT(*) as count
                        FROM ${BONG_HITS_DATABASE_NAME}
                        WHERE timestamp >= '${testDate}'
                        GROUP BY strftime('%H', timestamp)
                        ORDER BY time_label;
                    `;
                    timeDescription = 'Past 24 hours';
                    break;
                case 'W':
                    query = `
                        SELECT 
                            strftime('%w', timestamp) as time_label,
                            ROUND(AVG(duration_ms)/1000, 1) as avg_duration,
                            COUNT(*) as count
                        FROM ${BONG_HITS_DATABASE_NAME}
                        WHERE timestamp >= '${testDate}'
                        GROUP BY strftime('%w', timestamp)
                        ORDER BY time_label;
                    `;
                    timeDescription = 'Past week';
                    break;
                default:
                    query = `
                        SELECT 
                            strftime('%H:00', timestamp) as time_label,
                            ROUND(AVG(duration_ms)/1000, 1) as avg_duration,
                            COUNT(*) as count
                        FROM ${BONG_HITS_DATABASE_NAME}
                        WHERE timestamp >= '${testDate}'
                        GROUP BY strftime('%H', timestamp)
                        ORDER BY time_label;
                    `;
                    timeDescription = 'Past 24 hours';
            }

            const result = await db.getAllAsync<QueryResult>(query);
            console.log("Query result:", result);

            if (!result?.length) {
                console.log("No data returned from query");
                setDefaultValues();
                return;
            }

            // Process time labels based on selected range
            const timePoints = result.map(r => {
                if (!r?.time_label) return '';
                
                if (selectedRange === 'W') {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayIndex = parseInt(r.time_label);
                    return days[dayIndex] || '';
                }
                return r.time_label;
            }).filter(Boolean); // Remove empty strings

            const durationValues = result.map(r => 
                Math.round(r?.avg_duration || 0)
            );

            // Calculate average duration with null checks
            const totalDuration = result.reduce((acc, curr) => 
                acc + (curr?.avg_duration || 0), 0
            );
            const avgDuration = result.length ? 
                Math.round(totalDuration / result.length) : 0;
            
            // Calculate total hits with null checks
            const totalHits = result.reduce((acc, curr) => 
                acc + (curr?.count || 0), 0
            );

            // Update state with validated data
            setAverageDuration(avgDuration);
            setHitCount(totalHits);
            setChartData({
                labels: timePoints.length ? timePoints : ['No Data'],
                datasets: [{
                    data: durationValues.length ? durationValues : [0],
                    color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
                    strokeWidth: 2
                }]
            });

        } catch (error) {
            console.error('Error loading data:', error);
            setDefaultValues();
        }
    };

    const setDefaultValues = () => {
        setAverageDuration(0);
        setHitCount(0);
        setChartData({
            labels: ['No Data'],
            datasets: [{
                data: [0],
                color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
                strokeWidth: 2
            }]
        });
    };

    useEffect(() => {
        loadData();
    }, [selectedRange]);

    const chartConfig = {
        backgroundColor: COLORS.chartBackground,
        backgroundGradientFrom: COLORS.chartBackground,
        backgroundGradientTo: COLORS.chartBackground,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
        labelColor: (opacity = 0.8) => `rgba(255, 255, 255, ${opacity * 0.6})`,
        strokeWidth: 2,
        propsForVerticalLabels: {
            fontSize: 10,
            color: COLORS.text.tertiary
        },
        propsForHorizontalLabels: {
            fontSize: 10,
            color: COLORS.text.tertiary
        },
        propsForBackgroundLines: {
            strokeDasharray: "5, 5",
            stroke: COLORS.chart.grid,
            strokeWidth: 1
        },
        yAxisLabel: "",
        yAxisSuffix: "s",
        propsForDots: {
            r: "4",
            strokeWidth: "0",
            stroke: COLORS.primary,
            fill: COLORS.primary
        },
        fillShadowGradientFrom: 'rgba(0, 230, 118, 0.3)',
        fillShadowGradientTo: 'rgba(0, 230, 118, 0)',
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.primary} />
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
                                <MaterialCommunityIcons name="clock-outline" size={32} color={COLORS.primary} />
                            </View>
                            <Text style={styles.statusText}>{averageDuration}<Text style={styles.unitLabel}>s</Text></Text>
                        </View>
                        <Text style={styles.timeText}>
                            {selectedRange === 'H' ? 'Past hour average' :
                             selectedRange === 'D' ? 'Past day average' :
                             selectedRange === 'W' ? 'Past week average' :
                             selectedRange === 'M' ? 'Past month average' :
                             selectedRange === '6M' ? 'Past 6 months average' :
                             'Past year average'}
                        </Text>
                    </View>

                    <View style={styles.chartContainer}>
                        <LineChart
                            data={chartData}
                            width={windowWidth - 40}
                            height={200}
                            chartConfig={chartConfig}
                            bezier
                            withVerticalLabels={true}
                            withHorizontalLabels={true}
                            withInnerLines={true}
                            withOuterLines={false}
                            withVerticalLines={false}
                            withDots={true}
                            withShadow={false}
                            yAxisInterval={5}
                            segments={4}
                            style={styles.chart}
                        />
                    </View>

                    <View style={styles.notificationCard}>
                        <Text style={styles.notificationTitle}>Hit Statistics</Text>
                        <View style={styles.hitCountContainer}>
                            <Text style={styles.notificationCount}>{hitCount}</Text>
                            <MaterialCommunityIcons 
                                name="cannabis" 
                                size={18} 
                                color={COLORS.primary} 
                                style={styles.hitCountIcon}
                            />
                        </View>
                    </View>

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
                            icon={<MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.primary} />}
                            title="Average Duration"
                            description="On average, your hits this month were shorter than last month."
                            value={averageDuration}
                            period="February"
                        />

                        <InfoCard
                            icon={<MaterialCommunityIcons name="information-outline" size={24} color={COLORS.primary} />}
                            title="About Daily Average"
                            description="This represents the average duration of your hits measured in seconds. It can be helpful to understand your usage patterns and optimize your experience."
                            showArrow={false}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        backgroundColor: COLORS.background,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginLeft: 8,
        letterSpacing: 0.3,
    },
    content: {
        flex: 1,
        paddingBottom: 32,
    },
    timeSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        margin: 16,
        borderRadius: 10,
        padding: 3,
    },
    timeSelectorButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderRadius: 8,
    },
    timeSelectorButtonSelected: {
        backgroundColor: COLORS.primary,
    },
    timeSelectorText: {
        fontSize: 14,
        color: COLORS.text.secondary,
        fontWeight: '500',
    },
    timeSelectorTextSelected: {
        color: COLORS.background,
        fontWeight: '600',
    },
    exposureSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    exposureLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text.tertiary,
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    exposureStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusIconContainer: {
        marginRight: 12,
    },
    statusText: {
        fontSize: 42,
        fontWeight: '700',
        color: COLORS.text.primary,
        letterSpacing: -0.5,
    },
    unitLabel: {
        fontSize: 32,
        fontWeight: '400',
        color: COLORS.text.tertiary,
        marginLeft: 4,
    },
    timeText: {
        fontSize: 15,
        color: COLORS.text.secondary,
    },
    chartContainer: {
        marginHorizontal: 16,
        marginBottom: 24,
        backgroundColor: COLORS.chartBackground,
        borderRadius: 16,
        padding: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.1)',
    },
    chart: {
        borderRadius: 12,
    },
    notificationCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        marginHorizontal: 16,
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.1)',
    },
    notificationTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    hitCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationCount: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.primary,
    },
    hitCountIcon: {
        marginLeft: 4,
    },
    showMoreButton: {
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        marginHorizontal: 16,
    },
    showMoreText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '500',
    },
    highlightsSection: {
        paddingHorizontal: 16,
    },
    highlightsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    highlightsTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text.primary,
        letterSpacing: 0.3,
    },
    showAllText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '500',
    },
    infoCard: {
        position: 'relative',
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.1)',
    },
    cardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    infoCardContent: {
        padding: 16,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoCardTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
        color: COLORS.primary,
    },
    infoCardDescription: {
        fontSize: 15,
        color: COLORS.text.secondary,
        lineHeight: 22,
        marginBottom: 16,
    },
    monthComparison: {
        marginTop: 8,
    },
    monthValue: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    valueText: {
        fontSize: 36,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    unitText: {
        fontSize: 24,
        color: COLORS.text.tertiary,
        marginLeft: 4,
    },
    periodBar: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    periodText: {
        color: COLORS.background,
        fontSize: 15,
        fontWeight: '600',
    },
    arrowIcon: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -10,
    },
});