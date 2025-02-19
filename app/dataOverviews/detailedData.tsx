import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DataRowProps {
    label: string;
    value: string | number;
    time?: string | null;
}

const DataRow: React.FC<DataRowProps> = ({ label, value, time = null }) => (
    <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>{label}</Text>
        <View style={styles.valueContainer}>
            <Text style={styles.dataValue}>
                {value} <Text style={styles.unitText}>s</Text>
                {time && <Text style={styles.timeText}> ({time})</Text>}
            </Text>
        </View>
    </View>
);

export default function DetailedDataView() {
    const router = useRouter();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="chevron-left" size={30} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detailed Data</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.doneButton}>Done</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Session</Text>
                <View style={styles.card}>
                    <DataRow 
                        label="Average Duration" 
                        value="15.2" 
                        time="22 min"
                    />
                    <DataRow 
                        label="Session Duration" 
                        value="15.2" 
                        time="22 min"
                    />
                    <DataRow 
                        label="Average by Minute" 
                        value="12-18"
                    />
                    <DataRow 
                        label="Latest Hit" 
                        value="14.5"
                        time="18:29"
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily Statistics</Text>
                <View style={styles.card}>
                    <DataRow 
                        label="Total Hits Today" 
                        value="25"
                    />
                    <DataRow 
                        label="Peak Hour" 
                        value="18"
                        time="6 PM"
                    />
                    <DataRow 
                        label="Daily Average" 
                        value="15.8"
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Weekly Overview</Text>
                <View style={styles.card}>
                    <DataRow 
                        label="Total Weekly Hits" 
                        value="142"
                    />
                    <DataRow 
                        label="Weekly Average" 
                        value="14.3"
                    />
                    <DataRow 
                        label="Peak Day" 
                        value="32"
                        time="Wednesday"
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 8,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    doneButton: {
        fontSize: 17,
        color: '#007AFF',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
        color: '#000',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    dataLabel: {
        fontSize: 17,
        color: '#000',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    dataValue: {
        fontSize: 17,
        color: '#000',
        textAlign: 'right',
    },
    unitText: {
        fontSize: 17,
        color: '#666',
    },
    timeText: {
        fontSize: 15,
        color: '#666',
    },
}); 