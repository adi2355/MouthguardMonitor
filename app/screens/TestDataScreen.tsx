import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getInsertStatements, COLORS, BONG_HITS_DATABASE_NAME } from '../../src/constants';
import { DatabaseManager } from '../../src/DatabaseManager';
import { BluetoothService } from '../../src/services/BluetoothService';
import { BongHitsRepository } from '../../src/repositories/BongHitsRepository';
import { DeviceService } from '../../src/services/DeviceService';
import { StorageService } from '../../src/services/StorageService';
import { parseRawTimestamp } from '../../src/utils/functions';

// Test durations in seconds
const TEST_DURATIONS = [
  0.123, // 123ms
  0.456, // 456ms
  0.789, // 789ms
  1.234, // 1234ms
];

// Time offsets in hours for test data (relative to current time)
const TIME_OFFSETS = [
  0,     // Current time
  2,     // 2 hours ago
  6,     // 6 hours ago
  24,    // 1 day ago
];

export default function TestDataScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [bluetoothService, setBluetoothService] = useState<BluetoothService | null>(null);
  const [customTimestamp, setCustomTimestamp] = useState('');
  const [customDuration, setCustomDuration] = useState('');

  // Function to generate a timestamp string based on current date with an offset
  const getTestTimestamp = (offsetHours: number = 0): string => {
    const now = new Date();
    now.setHours(now.getHours() - offsetHours);
    
    const day = now.toLocaleString('en-US', { weekday: 'long' });
    const month = now.toLocaleString('en-US', { month: 'long' });
    const date = now.getDate();
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
    
    return `${day}, ${month} ${date} ${year} ${time}`;
  };

  // Initialize the services when component mounts
  useEffect(() => {
    const initServices = async () => {
      try {
        const dbManager = DatabaseManager.getInstance();
        await dbManager.ensureInitialized();
        const db = await dbManager.getDatabase(BONG_HITS_DATABASE_NAME);
        
        // Create repositories and services with proper dependencies
        const bongHitsRepo = new BongHitsRepository(db);
        const storageService = new StorageService();
        const deviceService = new DeviceService(storageService);
        
        // Create the BluetoothService using our repositories
        const btService = new BluetoothService(deviceService, bongHitsRepo);
        setBluetoothService(btService);
        
        console.log('[TestDataScreen] Services initialized successfully');
      } catch (error) {
        console.error('[TestDataScreen] Error initializing services:', error);
        Alert.alert('Error', 'Failed to initialize services');
      }
    };
    
    initServices();
  }, []);

  // Function to directly call the handleReceivedData method of BluetoothService
  const simulateBongHit = async (rawTimestamp: string, durationInSeconds: number) => {
    if (!bluetoothService) {
      Alert.alert('Error', 'BluetoothService not initialized');
      return;
    }
    
    try {
      setLoading(true);
      setResult(null);
      
      // This normally happens inside BluetoothHandler and gets passed to BluetoothService
      // We're simulating that flow here
      console.log(`[TestDataScreen] Simulating data - Raw: ${rawTimestamp}, Duration: ${durationInSeconds}s`);
      
      // Parse the raw timestamp to ISO format
      const isoTimestamp = parseRawTimestamp(rawTimestamp);
      console.log(`[TestDataScreen] Parsed ISO timestamp: ${isoTimestamp}`);
      
      // Add random milliseconds to ensure uniqueness for the database
      const date = new Date(isoTimestamp);
      date.setMilliseconds(Math.floor(Math.random() * 1000));
      const uniqueTimestamp = date.toISOString();
      console.log(`[TestDataScreen] Unique ISO timestamp: ${uniqueTimestamp}`);
      
      // Convert duration from seconds to milliseconds
      const durationMs = durationInSeconds * 1000;
      
      // Access the private handleReceivedData method through our trick
      // @ts-ignore - We know this is private but we're accessing it for testing
      await (bluetoothService as any).handleReceivedData(rawTimestamp, uniqueTimestamp, durationMs);
      
      setResult(`Successfully processed bong hit:\nRaw: ${rawTimestamp}\nISO: ${uniqueTimestamp}\nDuration: ${durationMs}ms`);
      
      // Force navigation back to update the UI
      router.push('/(tabs)/mydata');
    } catch (error) {
      console.error('[TestDataScreen] Error simulating bong hit:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const insertTestTimestamps = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const dbManager = DatabaseManager.getInstance();
      await dbManager.ensureInitialized();
      const db = await dbManager.getDatabase(BONG_HITS_DATABASE_NAME);
      
      // Clear existing data if needed
      await db.execAsync('DELETE FROM BongHits');
      
      // Get SQL insert statements from constants.ts
      const insertStatements = getInsertStatements();
      
      // Execute each statement
      const statements = insertStatements.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        await db.execAsync(`${statement.trim()};`);
      }
      
      // Get count to verify
      const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM BongHits');
      
      setResult(`Successfully inserted ${result?.count || 0} test timestamps.`);
      Alert.alert('Success', `Inserted ${result?.count || 0} test timestamps into the database.`);
      
      // Navigate to MyData to see results
      router.push('/(tabs)/mydata');
    } catch (error) {
      console.error('Error inserting test data:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', `Failed to insert test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTestData = async () => {
    if (!customTimestamp || !customDuration) {
      Alert.alert('Missing Data', 'Please enter both timestamp and duration');
      return;
    }
    
    try {
      const durationValue = parseFloat(customDuration);
      if (isNaN(durationValue) || durationValue <= 0) {
        Alert.alert('Invalid Duration', 'Duration must be a positive number');
        return;
      }
      
      await simulateBongHit(customTimestamp, durationValue);
    } catch (error) {
      console.error('[TestDataScreen] Error processing custom data:', error);
      Alert.alert('Error', 'Failed to process custom data');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bluetooth Testing Interface</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simulate Bluetooth Data</Text>
          <Text style={styles.sectionDescription}>
            Send test data through the entire Bluetooth pipeline, including data processing and 
            database storage. This simulates exactly what happens when real Bluetooth data is received.
          </Text>
          
          {/* Preset test data */}
          <View style={styles.testDataContainer}>
            <Text style={styles.subsectionTitle}>Preset Test Cases</Text>
            {TIME_OFFSETS.map((offset, index) => {
              const timestamp = getTestTimestamp(offset);
              const duration = TEST_DURATIONS[index % TEST_DURATIONS.length];
              const timeDesc = offset === 0 
                ? 'Current time' 
                : offset < 24 
                  ? `${offset} hours ago` 
                  : `${Math.floor(offset/24)} day${offset >= 48 ? 's' : ''} ago`;
              
              return (
                <TouchableOpacity 
                  key={index}
                  style={styles.testDataButton}
                  onPress={() => simulateBongHit(timestamp, duration)}
                  disabled={loading || !bluetoothService}
                >
                  <Ionicons name="pulse-outline" size={18} color="#fff" style={styles.buttonIcon} />
                  <View style={styles.testDataInfo}>
                    <Text style={styles.testDataText}>{timeDesc}</Text>
                    <Text style={styles.testDataSubtext}>Duration: {duration}s</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Custom test data */}
          <View style={styles.testDataContainer}>
            <Text style={styles.subsectionTitle}>Custom Test Data</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Raw timestamp (e.g. Tuesday, March 28 2024 15:40:12)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={customTimestamp}
              onChangeText={setCustomTimestamp}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Duration in seconds (e.g. 0.123)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="numeric"
              value={customDuration}
              onChangeText={setCustomDuration}
            />
            <TouchableOpacity 
              style={styles.customDataButton}
              onPress={handleCustomTestData}
              disabled={loading || !bluetoothService}
            >
              <Ionicons name="send-outline" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Send Custom Data</Text>
            </TouchableOpacity>
          </View>
          
          {/* Database insertion */}
          <View style={styles.testDataContainer}>
            <Text style={styles.subsectionTitle}>Bulk Test Data</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={insertTestTimestamps}
              disabled={loading}
            >
              <Ionicons name="time-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>
                {loading ? 'Inserting Data...' : 'Insert Bulk Test Data'}
              </Text>
              {loading && <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} />}
            </TouchableOpacity>
          </View>
          
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>View Data</Text>
          <Text style={styles.sectionDescription}>
            After inserting test data, you can view it on the MyData page.
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => router.push('/(tabs)/mydata')}
          >
            <Ionicons name="analytics-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Go to MyData</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  resultText: {
    color: COLORS.text.primary,
    fontSize: 14,
  },
  testDataContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 16,
  },
  testDataButton: {
    backgroundColor: 'rgba(0,120,255,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  testDataInfo: {
    flex: 1,
  },
  testDataText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  testDataSubtext: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: COLORS.text.primary,
    fontSize: 14,
  },
  customDataButton: {
    backgroundColor: '#00aa55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
}); 