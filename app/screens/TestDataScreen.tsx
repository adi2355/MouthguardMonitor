import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getInsertStatements, COLORS, BONG_HITS_DATABASE_NAME } from '../../src/constants';
import { DatabaseManager } from '../../src/DatabaseManager';

export default function TestDataScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Error inserting test data:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', `Failed to insert test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>Test Data Generator</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bong Hit Timestamps</Text>
          <Text style={styles.sectionDescription}>
            Insert test timestamp data into the BongHits database. This will help test data visualization
            and ensure the database is working correctly.
          </Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={insertTestTimestamps}
            disabled={loading}
          >
            <Ionicons name="time-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>
              {loading ? 'Inserting Data...' : 'Insert Test Timestamps'}
            </Text>
            {loading && <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} />}
          </TouchableOpacity>
          
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
  }
}); 