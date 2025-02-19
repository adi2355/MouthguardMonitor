import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Matching color theme from your app
const COLORS = {
  background: '#000000',
  cardBackground: '#1A1A1A',
  primary: '#00E676',
  primaryLight: '#69F0AE',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    quaternary: 'rgba(255, 255, 255, 0.4)',
  },
  divider: 'rgba(255, 255, 255, 0.1)',
};

interface DataRowProps {
    label: string;
    value: string | number;
    time?: string | null;
    icon?: React.ReactNode;
}

const DataRow: React.FC<DataRowProps> = ({ label, value, time = null, icon = null }) => (
    <View style={styles.dataRow}>
        <View style={styles.labelContainer}>
            {icon}
            <Text style={styles.dataLabel}>{label}</Text>
        </View>
        <View style={styles.valueContainer}>
            <Text style={styles.dataValue}>
                {value}
                <Text style={styles.unitText}>s</Text>
                {time && <Text style={styles.timeText}> • {time}</Text>}
            </Text>
        </View>
    </View>
);

export default function DetailedDataView() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detailed Data</Text>
                <TouchableOpacity 
                    style={styles.doneButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Current Session</Text>
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(0,230,118,0.1)', 'rgba(0,0,0,0)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                        />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Average Duration" 
                            value="15.2" 
                            time="22 min"
                        />
                        <View style={styles.divider} />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="timer-outline" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Session Duration" 
                            value="15.2" 
                            time="22 min"
                        />
                        <View style={styles.divider} />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="chart-timeline-variant" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Average by Minute" 
                            value="12-18"
                        />
                        <View style={styles.divider} />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="cannabis" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Latest Hit" 
                            value="14.5"
                            time="18:29"
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Daily Statistics</Text>
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(0,230,118,0.1)', 'rgba(0,0,0,0)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                        />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="counter" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Total Hits Today" 
                            value="25"
                        />
                        <View style={styles.divider} />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="chart-bell-curve-cumulative" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Peak Hour" 
                            value="18"
                            time="6 PM"
                        />
                        <View style={styles.divider} />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="chart-timeline-variant" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Daily Average" 
                            value="15.8"
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Overview</Text>
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(0,230,118,0.1)', 'rgba(0,0,0,0)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                        />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="calendar-week" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Total Weekly Hits" 
                            value="142"
                        />
                        <View style={styles.divider} />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="chart-line-variant" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Weekly Average" 
                            value="14.3"
                        />
                        <View style={styles.divider} />
                        <DataRow 
                            icon={<MaterialCommunityIcons name="calendar-star" size={20} color={COLORS.primary} style={styles.rowIcon} />}
                            label="Peak Day" 
                            value="32"
                            time="Wednesday"
                        />
                    </View>
                </View>
                
                <TouchableOpacity style={styles.exportButton}>
                    <MaterialCommunityIcons name="export-variant" size={20} color={COLORS.background} style={styles.exportIcon} />
                    <Text style={styles.exportText}>Export Data</Text>
                </TouchableOpacity>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text.primary,
        letterSpacing: 0.2,
    },
    doneButton: {
        padding: 6,
    },
    doneButtonText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '500',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        color: COLORS.text.primary,
        letterSpacing: 0.3,
    },
    card: {
        position: 'relative',
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.1)',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowIcon: {
        marginRight: 10,
    },
    dataLabel: {
        fontSize: 16,
        color: COLORS.text.secondary,
        fontWeight: '500',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    dataValue: {
        fontSize: 16,
        color: COLORS.text.primary,
        fontWeight: '600',
        textAlign: 'right',
    },
    unitText: {
        fontSize: 16,
        color: COLORS.text.tertiary,
        marginLeft: 2,
    },
    timeText: {
        fontSize: 14,
        color: COLORS.text.tertiary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginLeft: 48,
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    exportIcon: {
        marginRight: 8,
    },
    exportText: {
        fontSize: 16,
        color: COLORS.background,
        fontWeight: '600',
    }
});