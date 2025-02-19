import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SettingsItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
}

const SettingsItem = ({ icon, title, subtitle, onPress }: SettingsItemProps) => (
    <TouchableOpacity 
        style={styles.settingsItem} 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.settingsItemContent}>
            {icon}
            <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsItemTitle}>{title}</Text>
                <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
            </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#C7C7CC" />
    </TouchableOpacity>
);

export default function WeeklyAverageSettings() {
    const router = useRouter();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialCommunityIcons name="chevron-left" size={30} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Weekly Average</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>LIMIT USAGE</Text>
                <View style={styles.settingsGroup}>
                    <SettingsItem
                        icon={<MaterialCommunityIcons name="clock-outline" size={24} color="#5856D6" />}
                        title="Break Time"
                        subtitle="Schedule usage-free periods"
                        onPress={() => {}}
                    />
                    <SettingsItem
                        icon={<MaterialCommunityIcons name="timer-sand" size={24} color="#FF9500" />}
                        title="Daily Limits"
                        subtitle="Set max hits per day"
                        onPress={() => router.push('/dataOverviews/dailyLimits')}
                    />
                    <SettingsItem
                        icon={<MaterialCommunityIcons name="check-circle-outline" size={24} color="#34C759" />}
                        title="Exception Times"
                        subtitle="Set allowed times during breaks"
                        onPress={() => {}}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>MONITORING</Text>
                <View style={styles.settingsGroup}>
                    <SettingsItem
                        icon={<MaterialCommunityIcons name="chart-line" size={24} color="#34C759" />}
                        title="Usage Patterns"
                        subtitle="Track frequency and duration"
                        onPress={() => {}}
                    />
                    <SettingsItem
                        icon={<MaterialCommunityIcons name="bell-outline" size={24} color="#007AFF" />}
                        title="Usage Alerts"
                        subtitle="Set reminders and warnings"
                        onPress={() => {}}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 8,
    },
    section: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginLeft: 16,
        marginBottom: 8,
    },
    settingsGroup: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E5EA',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    settingsItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingsTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    settingsItemTitle: {
        fontSize: 17,
        color: '#000',
    },
    settingsItemSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
}); 