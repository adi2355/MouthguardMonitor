import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { DatabaseManager } from '../../src/DatabaseManager';
import { SQLiteDatabase } from 'expo-sqlite';

interface LogItem {
  id: number;
  timestamp: string;
  type: string;
  data: string;
}

export default function LogsScreen() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allLogs: LogItem[] = [];
      
      // Fetch different types of logs
      const motionLogs = await fetchLogsByType('motion');
      const fsrLogs = await fetchLogsByType('fsr');
      const hrmLogs = await fetchLogsByType('hrm');
      const htmLogs = await fetchLogsByType('htm');
      
      // Combine all logs
      allLogs.push(...motionLogs, ...fsrLogs, ...hrmLogs, ...htmLogs);
      
      // Sort logs by timestamp (newest first)
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(allLogs);
      setFilteredLogs(allLogs);
      setActiveTab('all');
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(`Failed to fetch logs: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLogsByType = async (type: string): Promise<LogItem[]> => {
    try {
      const db = await DatabaseManager.getInstance().getDatabase('mouthguardMonitor.db');
      
      let query = '';
      switch (type) {
        case 'motion':
          query = `
            SELECT id, device_timestamp as timestamp, app_timestamp,
            'motion' as type,
            json_object(
              'accel16_x', accel16_x,
              'accel16_y', accel16_y,
              'accel16_z', accel16_z,
              'accel200_x', accel200_x,
              'accel200_y', accel200_y,
              'accel200_z', accel200_z,
              'gyro_x', gyro_x,
              'gyro_y', gyro_y,
              'gyro_z', gyro_z,
              'mag_x', mag_x,
              'mag_y', mag_y,
              'mag_z', mag_z,
              'bite_l', bite_l,
              'bite_r', bite_r
            ) as data
            FROM motion_packets
            ORDER BY device_timestamp DESC
            LIMIT 100
          `;
          break;
        case 'fsr':
          query = `
            SELECT id, device_timestamp as timestamp, app_timestamp,
            'fsr' as type,
            json_object(
              'left_bite', left_bite,
              'right_bite', right_bite
            ) as data
            FROM fsr_packets
            ORDER BY app_timestamp DESC
            LIMIT 100
          `;
          break;
        case 'hrm':
          query = `
            SELECT id, app_timestamp as timestamp, 
            'hrm' as type,
            json_object('heart_rate', heart_rate) as data
            FROM hrm_packets
            ORDER BY app_timestamp DESC
            LIMIT 100
          `;
          break;
        case 'htm':
          query = `
            SELECT id, app_timestamp as timestamp, 
            'htm' as type,
            json_object('temperature', temperature) as data
            FROM htm_packets
            ORDER BY app_timestamp DESC
            LIMIT 100
          `;
          break;
        default:
          return [];
      }
      
      try {
        // getAllAsync returns the array of rows directly
        const resultRows = await db.getAllAsync<any>(query);
        
        console.log(`[LogsScreen] Raw result for ${type}:`, JSON.stringify(resultRows).substring(0, 200) + '...'); // Log first part to avoid huge logs
        console.log(`[LogsScreen] Result type: ${typeof resultRows}, is array: ${Array.isArray(resultRows)}, length: ${Array.isArray(resultRows) ? resultRows.length : 'N/A'}`);
        
        // Check if resultRows is an array and has items
        if (Array.isArray(resultRows) && resultRows.length > 0) {
          console.log(`[LogsScreen] Found ${resultRows.length} rows for ${type} logs.`);
          return resultRows.map((row: any) => ({
            id: row.id,
            // Ensure timestamp exists, fallback if necessary
            timestamp: row.timestamp ?? row.device_timestamp ?? new Date().toISOString(),
            app_timestamp: row.app_timestamp,
            type: row.type,
            data: row.data // Assuming 'data' is correctly formed by the JSON_OBJECT function
          }));
        } else {
          console.log(`[LogsScreen] No rows found or invalid result for ${type} logs.`);
          return [];
        }
      } catch (queryError) {
        console.error(`Error executing query for ${type} logs:`, queryError);
        return [];
      }
    } catch (err) {
      console.error(`Error getting database for ${type} logs:`, err);
      throw err;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
  };

  const filterLogs = (type: string) => {
    setActiveTab(type);
    if (type === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => log.type === type));
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatLogData = (data: string, type: string) => {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      switch (type) {
        case 'motion':
          return `Accel16(x,y,z): ${parsedData.accel16_x}, ${parsedData.accel16_y}, ${parsedData.accel16_z}\n` +
                 `Accel200(x,y,z): ${parsedData.accel200_x}, ${parsedData.accel200_y}, ${parsedData.accel200_z}\n` +
                 `Gyro(x,y,z): ${parsedData.gyro_x}, ${parsedData.gyro_y}, ${parsedData.gyro_z}\n` +
                 `Mag(x,y,z): ${parsedData.mag_x}, ${parsedData.mag_y}, ${parsedData.mag_z}\n` +
                 `Bite(L/R): ${parsedData.bite_l}, ${parsedData.bite_r}`;
        case 'fsr':
          return `Bite Force (L/R): ${parsedData.left_bite}, ${parsedData.right_bite}`;
        case 'hrm':
          return `Heart rate: ${parsedData.heart_rate} BPM`;
        case 'htm':
          return `Temperature: ${parsedData.temperature}°C`;
        default:
          return JSON.stringify(parsedData, null, 2);
      }
    } catch (err) {
      console.error(`Error formatting log data: ${err}`);
      return String(data);
    }
  };

  const renderLogItem = (log: LogItem) => {
    const formattedData = formatLogData(log.data, log.type);
    
    // Use app_timestamp for FSR and motion logs when available
    let displayTimestampMs;
    
    if (log.type === 'fsr' || log.type === 'motion') {
      // For FSR and motion, prefer app_timestamp over device_timestamp for display
      if ((log as any).app_timestamp && typeof (log as any).app_timestamp === 'number') {
        displayTimestampMs = (log as any).app_timestamp;
      } else {
        // If no app_timestamp, show device uptime instead of incorrect date
        const deviceTimestamp = typeof log.timestamp === 'string' ? 
          parseInt(log.timestamp, 10) : log.timestamp;
        
        // Don't construct Date if displayTimestampMs is undefined
        const formattedTime = `Device Uptime: ${deviceTimestamp}ms`;
        const formattedDate = "";
        
        // Check if this is a recent entry (within the last minute)
        const isRecent = Date.now() - ((log as any).app_timestamp || 0) < 60000; // 60 seconds
        
        return (
          <View key={`${log.type}_${log.id}`} style={[
            styles.logItem, 
            isRecent && styles.recentLogItem
          ]}>
            <View style={styles.logHeader}>
              <Text style={styles.logType}>
                {log.type.toUpperCase()}
                {isRecent && " (NEW)"}
              </Text>
              <Text style={styles.logTime}>{formattedTime}</Text>
            </View>
            <Text style={styles.logData}>{formattedData}</Text>
          </View>
        );
      }
    } else {
      // For other logs, use the existing timestamp logic
    if (typeof log.timestamp === 'string') {
      const parsedTimestamp = parseInt(log.timestamp, 10);
      // Check if this looks like a seconds-based epoch (10 digits) or millisecond epoch (13 digits)
        displayTimestampMs = parsedTimestamp < 10000000000 
        ? parsedTimestamp * 1000  // Convert seconds to milliseconds
        : parsedTimestamp;        // Already milliseconds
    } else {
        displayTimestampMs = log.timestamp;
      }
    }
    
    // Only try to format as date if we have a valid app_timestamp
    const logDate = new Date(displayTimestampMs);
    const formattedTime = logDate.toLocaleTimeString();
    const formattedDate = logDate.toLocaleDateString();
    
    // Check if this is a recent entry (within the last minute)
    const isRecent = Date.now() - displayTimestampMs < 60000; // 60 seconds
    
    return (
      <View key={`${log.type}_${log.id}`} style={[
        styles.logItem, 
        isRecent && styles.recentLogItem
      ]}>
        <View style={styles.logHeader}>
          <Text style={styles.logType}>
            {log.type.toUpperCase()}
            {isRecent && " (NEW)"}
          </Text>
          <Text style={styles.logTime}>{formattedDate} {formattedTime}</Text>
        </View>
        <Text style={styles.logData}>{formattedData}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Database Logs",
          headerStyle: { backgroundColor: '#f5f5f5' },
        }}
      />
      
      <View style={styles.tabContainer}>
        {['all', 'motion', 'fsr', 'hrm', 'htm'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => filterLogs(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'all' ? 'All' : tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading logs...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchLogs}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No logs found</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'all' 
                ? 'No data has been recorded in the database yet.' 
                : `No ${activeTab} logs have been recorded.`}
            </Text>
          </View>
        ) : (
          filteredLogs.map(renderLogItem)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  logItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  recentLogItem: {
    backgroundColor: '#e6f7ff', // Light blue to highlight new entries
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logType: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  logTime: {
    color: '#666',
    fontSize: 12,
  },
  logData: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066cc',
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    color: '#666',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066cc',
  },
  activeTabText: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
}); 