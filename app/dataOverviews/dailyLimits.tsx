import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_LIMIT_KEY = 'dailyHitLimit';
const LIMIT_ENABLED_KEY = 'dailyLimitEnabled';

export default function DailyLimits() {
    const router = useRouter();
    const [isEnabled, setIsEnabled] = useState(false);
    const [currentLimit, setCurrentLimit] = useState(10);

    React.useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const limitEnabled = await AsyncStorage.getItem(LIMIT_ENABLED_KEY);
            const savedLimit = await AsyncStorage.getItem(DAILY_LIMIT_KEY);
            
            setIsEnabled(limitEnabled === 'true');
            if (savedLimit) {
                setCurrentLimit(parseInt(savedLimit));
            }
        } catch (error) {
            console.error('Error loading daily limit settings:', error);
        }
    };

    const toggleSwitch = async () => {
        try {
            const newValue = !isEnabled;
            setIsEnabled(newValue);
            await AsyncStorage.setItem(LIMIT_ENABLED_KEY, newValue.toString());
        } catch (error) {
            console.error('Error saving limit enabled state:', error);
        }
    };

    const adjustLimit = async (increment: boolean) => {
        const newLimit = increment ? currentLimit + 1 : Math.max(1, currentLimit - 1);
        try {
            setCurrentLimit(newLimit);
            await AsyncStorage.setItem(DAILY_LIMIT_KEY, newLimit.toString());
        } catch (error) {
            console.error('Error saving daily limit:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialCommunityIcons name="chevron-left" size={30} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Limits</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.settingsGroup}>
                    <View style={styles.settingsRow}>
                        <Text style={styles.settingsLabel}>Enable Daily Limit</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={isEnabled ? "#007AFF" : "#f4f3f4"}
                            onValueChange={toggleSwitch}
                            value={isEnabled}
                        />
                    </View>

                    {isEnabled && (
                        <View style={styles.limitAdjuster}>
                            <Text style={styles.limitLabel}>Maximum hits per day:</Text>
                            <View style={styles.limitControls}>
                                <TouchableOpacity 
                                    onPress={() => adjustLimit(false)}
                                    style={styles.adjustButton}
                                    disabled={currentLimit <= 1}
                                >
                                    <Text style={styles.adjustButtonText}>−</Text>
                                </TouchableOpacity>
                                
                                <Text style={styles.limitValue}>{currentLimit}</Text>
                                
                                <TouchableOpacity 
                                    onPress={() => adjustLimit(true)}
                                    style={styles.adjustButton}
                                >
                                    <Text style={styles.adjustButtonText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                <Text style={styles.description}>
                    When enabled, you'll receive notifications when approaching your daily limit.
                </Text>
            </View>
        </View>
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
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 8,
    },
    content: {
        padding: 16,
    },
    settingsGroup: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    settingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingsLabel: {
        fontSize: 17,
        color: '#000',
    },
    limitAdjuster: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    limitLabel: {
        fontSize: 15,
        color: '#666',
        marginBottom: 12,
    },
    limitControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    adjustButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adjustButtonText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '600',
        lineHeight: 24,
    },
    limitValue: {
        fontSize: 24,
        fontWeight: '600',
        marginHorizontal: 24,
    },
    description: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 16,
    },
}); 