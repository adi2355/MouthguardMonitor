import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MOUTHGUARD_DB_NAME, COLORS } from '../../src/constants';
import { DatabaseManager } from '../../src/DatabaseManager';
import { BluetoothService } from '../../src/services/BluetoothService';
import {
  SAMPLE_ATHLETES,
  SAMPLE_SENSOR_READINGS,
  SAMPLE_IMPACT_EVENTS,
  SAMPLE_SESSIONS,
  SAMPLE_SESSION_ATHLETES,
  SAMPLE_CALIBRATION_DATA,
  DEVICE_ID_SIM,
  BULK_SIMULATED_MOTION,
  BULK_SIMULATED_FSR,
  SIMULATED_MOTION_PACKET,
  SIMULATED_FSR_PACKET,
  SIMULATED_HRM_DATA,
  SIMULATED_HTM_DATA,
} from '../../src/constants';
import { SensorDataRepository } from '../../src/repositories/SensorDataRepository';
import LineChart from '../components/charts/LineChart';
import { useSensorDataRepository } from '../../src/providers/AppProvider';
import { MotionPacket, FSRPacket, HRMPacket, HTMPacket } from '../../src/types';

// Test data generation utilities
const TEST_DURATIONS = [ 123, 456, 789, 1234 ]; // Example durations in ms
const TIME_OFFSETS = [ 0, 2, 6, 24 ];

// Define interfaces for our data types
interface Athlete {
  id: string;
  name: string;
  team: string;
  position: string;
  height: number;
  weight: number;
  deviceId?: string;
  createdAt: number;
}

interface ImpactEvent {
  id: string;
  deviceId: string;
  athleteId: string;
  timestamp: number;
  magnitude: number;
  duration: number;
  severity: string;
  location: string;
  createdAt: number;
}

// Generate test data for a period of time
const generateTestDataForPeriod = async (sensorDataRepository: SensorDataRepository, deviceId: string, days: number = 7) => {
  const now = Date.now();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const dataPoints = days * 24; // 24 data points per day (hourly)
  const results = [];
  
  for (let i = 0; i < dataPoints; i++) {
    // Generate timestamps going back 'days' days up to now
    const timestamp = Math.floor((now - (millisecondsPerDay * days) + (millisecondsPerDay * i / 24)) / 1000);
    
    try {
      // Generate motion data
      const motionPacket: MotionPacket = {
        ...SIMULATED_MOTION_PACKET,
        gyro: [Math.random()*20-10, Math.random()*20-10, Math.random()*20-10].map(n=>Math.round(n)) as [number,number,number],
        accel16: [Math.random()*200-100, Math.random()*200-100, 900 + Math.random()*200].map(n=>Math.round(n)) as [number,number,number],
        timestamp: timestamp,
      };
      await sensorDataRepository.recordMotionPacket(deviceId, motionPacket);
      
      // Generate FSR data
      const fsrPacket: FSRPacket = {
        ...SIMULATED_FSR_PACKET,
        left_bite: 400 + Math.round(Math.random()*200),
        right_bite: 400 + Math.round(Math.random()*200),
        timestamp: timestamp,
      };
      await sensorDataRepository.recordFSRPacket(deviceId, fsrPacket);
      
      // Generate HRM data (every 6 hours)
      if (i % 6 === 0) {
        const hrmPacket: HRMPacket = {
          ...SIMULATED_HRM_DATA,
          heartRate: 60 + Math.round(Math.random()*40),
          appTimestamp: now - (millisecondsPerDay * days) + (millisecondsPerDay * i / 24),
        };
        await sensorDataRepository.recordHRMPacket(deviceId, hrmPacket);
      }
      
      // Generate HTM data (every 12 hours)
      if (i % 12 === 0) {
        const htmPacket: HTMPacket = {
          ...SIMULATED_HTM_DATA,
          temperature: 97.0 + Math.random() * 3,
          appTimestamp: now - (millisecondsPerDay * days) + (millisecondsPerDay * i / 24),
        };
        await sensorDataRepository.recordHTMPacket(deviceId, htmPacket);
      }
    } catch (e) {
      console.error("Error generating test data:", e);
    }
  }
  
  return `Generated ${dataPoints} hours of test data spanning ${days} days`;
};

export default function TestDataScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [customDeviceId, setCustomDeviceId] = useState('');
  const [customMagnitude, setCustomMagnitude] = useState('');
  const [activeTab, setActiveTab] = useState<'inject' | 'manual'>('inject');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [selectedImpactId, setSelectedImpactId] = useState<string | null>(null);

  // Get the DatabaseManager instance on component mount
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await DatabaseManager.getInstance().getDatabase(MOUTHGUARD_DB_NAME);
        console.log('[TestDataScreen] Successfully connected to database');
      } catch (error) {
        console.error('[TestDataScreen] Database initialization error:', error);
      }
    };
    
    initDatabase();
  }, []);

  // Get repository using the custom hook
  const sensorDataRepository = useSensorDataRepository();

  // --- Bulk Data Injection ---
  const injectBulkTestData = async () => {
    setLoading(true);
    setResult(null);
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    try {
      console.log('[TestDataScreen] Injecting bulk simulated data...');

      // Inject Motion Packets
      results.push("Injecting Motion Packets...");
      for (const packet of BULK_SIMULATED_MOTION) {
        try {
          await sensorDataRepository.recordMotionPacket(DEVICE_ID_SIM, packet);
          successCount++;
        } catch (e) { errorCount++; console.error("Motion inject error:", e); }
      }
      results.push(`  -> ${BULK_SIMULATED_MOTION.length} motion packets processed.`);

      // Inject FSR Packets
      results.push("Injecting FSR Packets...");
      for (const packet of BULK_SIMULATED_FSR) {
         try {
          await sensorDataRepository.recordFSRPacket(DEVICE_ID_SIM, packet);
          successCount++;
        } catch (e) { errorCount++; console.error("FSR inject error:", e); }
      }
       results.push(`  -> ${BULK_SIMULATED_FSR.length} FSR packets processed.`);

       // Inject Single HRM/HTM for example
       results.push("Injecting Sample HRM/HTM...");
       try {
          await sensorDataRepository.recordHRMPacket(DEVICE_ID_SIM, SIMULATED_HRM_DATA);
          successCount++;
        } catch (e) { errorCount++; console.error("HRM inject error:", e); }
       try {
          await sensorDataRepository.recordHTMPacket(DEVICE_ID_SIM, SIMULATED_HTM_DATA);
          successCount++;
        } catch (e) { errorCount++; console.error("HTM inject error:", e); }
       results.push(`  -> 1 HRM, 1 HTM packet processed.`);


      setResult(`Bulk Injection Complete:\n${results.join('\n')}\nSuccess: ${successCount}, Errors: ${errorCount}`);
      console.log('[TestDataScreen] Bulk data injection finished.');

    } catch (error) {
      console.error('[TestDataScreen] Error injecting bulk test data:', error);
      setResult(`Bulk Injection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Manual Single Data Entry ---
  const addSinglePacket = async (type: 'motion' | 'fsr' | 'hrm' | 'htm') => {
    setLoading(true);
    setResult(null);
    const currentDeviceTime = () => Math.floor(Date.now() / 1000);

    try {
      let packetInfo = "";
      switch (type) {
        case 'motion':
          const motionPacket: MotionPacket = {
            ...SIMULATED_MOTION_PACKET, // Use defaults
            // Randomize slightly for variety
            gyro: [Math.random()*20-10, Math.random()*20-10, Math.random()*20-10].map(n=>Math.round(n)) as [number,number,number],
            accel16: [Math.random()*200-100, Math.random()*200-100, 900 + Math.random()*200].map(n=>Math.round(n)) as [number,number,number],
            timestamp: currentDeviceTime(),
          };
          await sensorDataRepository.recordMotionPacket(DEVICE_ID_SIM, motionPacket);
          packetInfo = `Motion Packet (Timestamp: ${motionPacket.timestamp})`;
          break;
        case 'fsr':
           const fsrPacket: FSRPacket = {
             ...SIMULATED_FSR_PACKET, // Use defaults
             left_bite: 400 + Math.round(Math.random()*200),
             right_bite: 400 + Math.round(Math.random()*200),
             timestamp: currentDeviceTime(),
           };
          await sensorDataRepository.recordFSRPacket(DEVICE_ID_SIM, fsrPacket);
          packetInfo = `FSR Packet (Timestamp: ${fsrPacket.timestamp})`;
          break;
        case 'hrm':
           const hrmPacket: HRMPacket = {
               ...SIMULATED_HRM_DATA,
               heartRate: 60 + Math.round(Math.random()*40),
               appTimestamp: Date.now(),
           };
          await sensorDataRepository.recordHRMPacket(DEVICE_ID_SIM, hrmPacket);
          packetInfo = `HRM Packet (Rate: ${hrmPacket.heartRate})`;
          break;
        case 'htm':
           const htmPacket: HTMPacket = {
               ...SIMULATED_HTM_DATA,
               temperature: 97.0 + Math.random() * 3, // Random temp F
               appTimestamp: Date.now(),
           };
          await sensorDataRepository.recordHTMPacket(DEVICE_ID_SIM, htmPacket);
           packetInfo = `HTM Packet (Temp: ${htmPacket.temperature.toFixed(1)}°F)`;
          break;
      }
      setResult(`Successfully added single ${packetInfo}`);
      console.log(`[TestDataScreen] Added single ${type} packet.`);

    } catch (error) {
      console.error(`[TestDataScreen] Error adding single ${type} packet:`, error);
      setResult(`Error adding ${type} packet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to Logs screen
  const navigateToLogs = () => {
    router.push('/screens/logs');
  };

  // Get accelerometer data for the selected athlete
  const getAccelerometerData = () => {
    if (!selectedAthleteId) return [];
    
    const athlete = SAMPLE_ATHLETES.find(a => (a as any).id === selectedAthleteId);
    if (!athlete || !(athlete as any).deviceId) return [];
    
    const deviceId = (athlete as any).deviceId;
    const accelerometerReadings = SAMPLE_SENSOR_READINGS
      .find(group => group.table === 'accelerometer_data')?.data || [];
    
    // Use type assertion to handle mixed types in the data
    return (accelerometerReadings as any[])
      .filter(reading => 
        reading.deviceId === deviceId && 
        'x' in reading && 'y' in reading && 'z' in reading
      )
      .map(reading => {
        // Calculate magnitude
        const x = reading.x || 0;
        const y = reading.y || 0;
        const z = reading.z || 0;
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        return { ...reading, magnitude };
      });
  };

  // Get impact details for the selected impact
  const getSelectedImpactDetails = () => {
    if (!selectedImpactId) return null;
    
    const impact = (SAMPLE_IMPACT_EVENTS as any[]).find(i => i.id === selectedImpactId);
    if (!impact) return null;
    
    const athlete = (SAMPLE_ATHLETES as any[]).find(a => a.id === impact.athleteId);
    
    return {
      ...impact,
      athleteName: athlete?.name || 'Unknown'
    };
  };

  // Render athlete item in the list
  const renderAthleteItem = ({ item }: { item: Athlete }) => {
    const isSelected = selectedAthleteId === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.dataItem, isSelected && styles.selectedDataItem]}
        onPress={() => setSelectedAthleteId(isSelected ? null : item.id)}
      >
        <View style={styles.dataItemIcon}>
          <MaterialCommunityIcons 
            name="account" 
            size={20} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.dataItemInfo}>
          <Text style={styles.dataItemTitle}>{item.name}</Text>
          <Text style={styles.dataItemSubtitle}>
            {item.team} • {item.position}
            {item.deviceId ? ` • Device: ${item.deviceId}` : ' • No Device'}
          </Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons 
            name="check-circle" 
            size={20} 
            color={COLORS.primary} 
            style={styles.selectedIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Render impact event item in the list
  const renderImpactItem = ({ item }: { item: ImpactEvent }) => {
    const isSelected = selectedImpactId === item.id;
    const athlete = SAMPLE_ATHLETES.find(a => a.id === item.athleteId);
    
    return (
      <TouchableOpacity 
        style={[styles.dataItem, isSelected && styles.selectedDataItem]}
        onPress={() => setSelectedImpactId(isSelected ? null : item.id)}
      >
        <View style={[styles.impactSeverity, { backgroundColor: getSeverityColor(item.severity) }]} />
        <View style={styles.dataItemInfo}>
          <Text style={styles.dataItemTitle}>{item.magnitude.toFixed(1)}g Impact</Text>
          <Text style={styles.dataItemSubtitle}>
            {athlete?.name || 'Unknown'} • {formatDate(item.timestamp)}
          </Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons 
            name="check-circle" 
            size={20} 
            color={COLORS.primary} 
            style={styles.selectedIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Prepare data for charts based on selected athlete or impact
  const prepareChartData = () => {
    if (selectedAthleteId) {
      // Show athlete's sensor data
      const accelerometerData = getAccelerometerData();
      
      if (accelerometerData.length === 0) {
        return { labels: [], data: [] };
      }
      
      // Get magnitudes for chart
      const magnitudes = accelerometerData
        .filter(reading => 'x' in reading && 'y' in reading && 'z' in reading)
        .map(reading => {
          if ('magnitude' in reading) {
            return reading.magnitude;
          } 
          if ('x' in reading && 'y' in reading && 'z' in reading) {
            return Math.sqrt(
              Math.pow(reading.x || 0, 2) + 
              Math.pow(reading.y || 0, 2) + 
              Math.pow(reading.z || 0, 2)
            );
          }
          return 0;
        });
      
      // Create sequential labels
      const labels = accelerometerData.map((_, index) => `${index + 1}`);
      
      return { labels, data: magnitudes };
    } 
    else if (selectedImpactId) {
      // Show impact data
      const impact = getSelectedImpactDetails();
      if (!impact) {
        return { labels: [], data: [] };
      }
      
      // For an impact, we generate a bell curve to simulate the impact waveform
      const pointCount = 20;
      const peakIndex = Math.floor(pointCount / 2);
      const data = Array(pointCount).fill(0).map((_, i) => {
        const distance = Math.abs(i - peakIndex);
        const falloff = Math.exp(-(distance * distance) / 8);
        return impact.magnitude * falloff;
      });
      
      const labels = Array(pointCount).fill(0).map((_, i) => `${i}`);
      
      return { labels, data };
    }
    
    // Default empty data
    return { labels: [], data: [] };
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'inject':
        return (
          <View>
            {/* Bulk Data Injection Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inject Simulated Data</Text>
              <Text style={styles.sectionDescription}>
                Inject simulated packet data (Motion, FSR, HRM, HTM) into the database based on `constants.ts`.
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: COLORS.info}]}
                onPress={injectBulkTestData}
                disabled={loading}
              >
                <MaterialCommunityIcons name="database-import-outline" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {loading ? 'Injecting Data...' : 'Inject Bulk Simulated Data'}
                </Text>
                {loading && <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} />}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: COLORS.success, marginTop: 10}]}
                onPress={async () => {
                  setLoading(true);
                  setResult(null);
                  try {
                    const result = await generateTestDataForPeriod(sensorDataRepository, DEVICE_ID_SIM, 7);
                    setResult(`Test Data Generation Complete:\n${result}`);
                  } catch (error) {
                    console.error('[TestDataScreen] Error generating test data:', error);
                    setResult(`Error generating test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <MaterialCommunityIcons name="calendar-clock" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {loading ? 'Generating Data...' : 'Generate 1-Week Test Data'}
                </Text>
                {loading && <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} />}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: COLORS.error, marginTop: 10}]}
                onPress={async () => {
                  Alert.alert(
                    "Generate Test Data",
                    "How many days of test data would you like to generate?",
                    [
                      {
                        text: "Cancel",
                        style: "cancel"
                      },
                      {
                        text: "1 Day",
                        onPress: async () => {
                          setLoading(true);
                          setResult(null);
                          try {
                            const result = await generateTestDataForPeriod(sensorDataRepository, DEVICE_ID_SIM, 1);
                            setResult(`Test Data Generation Complete:\n${result}`);
                          } catch (error) {
                            console.error('[TestDataScreen] Error generating test data:', error);
                            setResult(`Error generating test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
                          } finally {
                            setLoading(false);
                          }
                        }
                      },
                      {
                        text: "3 Days",
                        onPress: async () => {
                          setLoading(true);
                          setResult(null);
                          try {
                            const result = await generateTestDataForPeriod(sensorDataRepository, DEVICE_ID_SIM, 3);
                            setResult(`Test Data Generation Complete:\n${result}`);
                          } catch (error) {
                            console.error('[TestDataScreen] Error generating test data:', error);
                            setResult(`Error generating test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
                          } finally {
                            setLoading(false);
                          }
                        }
                      },
                      {
                        text: "7 Days",
                        onPress: async () => {
                          setLoading(true);
                          setResult(null);
                          try {
                            const result = await generateTestDataForPeriod(sensorDataRepository, DEVICE_ID_SIM, 7);
                            setResult(`Test Data Generation Complete:\n${result}`);
                          } catch (error) {
                            console.error('[TestDataScreen] Error generating test data:', error);
                            setResult(`Error generating test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
                          } finally {
                            setLoading(false);
                          }
                        }
                      },
                      {
                        text: "30 Days",
                        onPress: async () => {
                          setLoading(true);
                          setResult(null);
                          try {
                            const result = await generateTestDataForPeriod(sensorDataRepository, DEVICE_ID_SIM, 30);
                            setResult(`Test Data Generation Complete:\n${result}`);
                          } catch (error) {
                            console.error('[TestDataScreen] Error generating test data:', error);
                            setResult(`Error generating test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
                          } finally {
                            setLoading(false);
                          }
                        }
                      }
                    ]
                  );
                }}
                disabled={loading}
              >
                <MaterialCommunityIcons name="calendar-plus" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  Custom Data Generation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'manual':
        return (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Manually Add Single Packet</Text>
              <Text style={styles.sectionDescription}>
                Add a single data packet with the current timestamp and randomized values.
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: COLORS.accent2, marginBottom: 10}]}
                onPress={() => addSinglePacket('motion')} disabled={loading}>
                <MaterialCommunityIcons name="axis-arrow" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Add Motion Packet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                 style={[styles.actionButton, {backgroundColor: COLORS.accent3, marginBottom: 10}]}
                onPress={() => addSinglePacket('fsr')} disabled={loading}>
                 <MaterialCommunityIcons name="tooth-outline" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Add FSR Packet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                 style={[styles.actionButton, {backgroundColor: COLORS.accent4, marginBottom: 10}]}
                onPress={() => addSinglePacket('hrm')} disabled={loading}>
                 <MaterialCommunityIcons name="heart-pulse" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Add HRM Packet</Text>
              </TouchableOpacity>
               <TouchableOpacity
                 style={[styles.actionButton, {backgroundColor: COLORS.accent5, marginBottom: 10}]}
                onPress={() => addSinglePacket('htm')} disabled={loading}>
                 <MaterialCommunityIcons name="thermometer" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Add HTM Packet</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Simulation</Text>
      </View>

      {/* Tab navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'inject' && styles.activeTabButton]}
          onPress={() => setActiveTab('inject')}>
          <MaterialCommunityIcons name="database-arrow-down" size={18} color={activeTab === 'inject' ? COLORS.primary : COLORS.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'inject' && styles.activeTabText]}>Inject Data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'manual' && styles.activeTabButton]}
          onPress={() => setActiveTab('manual')}>
          <MaterialCommunityIcons name="plus-box" size={18} color={activeTab === 'manual' ? COLORS.primary : COLORS.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manual Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderTabContent()}

        {/* Result Display */}
        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Result:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}

        {/* Navigation Section - Keep if needed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigate</Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => router.push('/(tabs)/devices')}>
            <Ionicons name="people-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Go to Athletes & Devices</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#9C27B0', marginTop: 8 }]}
            onPress={() => router.push('/(tabs)/reportsDetailed')}>
            <Ionicons name="document-text-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Go to Detailed Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50', marginTop: 8 }]}
            onPress={navigateToLogs}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>View Data Logs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
const getSeverityColor = (severity?: string): string => {
  switch (severity?.toLowerCase()) {
    case 'severe':
      return COLORS.danger;
    case 'moderate':
      return COLORS.warning;
    case 'mild':
      return COLORS.success;
    default:
      return COLORS.primary;
  }
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: true 
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  resultText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginLeft: 6,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Added styles for list items
  dataItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  selectedDataItem: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  dataItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,84,50,0.1)', // Primary with low opacity
    marginRight: 12,
  },
  dataItemInfo: {
    flex: 1,
  },
  dataItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  dataItemSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  selectedIcon: {
    marginLeft: 8,
  },
  impactSeverity: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
}); 