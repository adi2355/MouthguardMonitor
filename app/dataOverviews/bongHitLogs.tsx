import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { COLORS } from '../../src/constants';
import { databaseManager } from "../../src/DatabaseManager";
import LoadingView from '../components/shared/LoadingView';
import ErrorView from '../components/shared/ErrorView';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BongHit } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';

const BongHitLogs = () => {
  const router = useRouter();
  const [logs, setLogs] = useState<BongHit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const dataService = databaseManager;
      const response = await databaseManager.getAllBongHitLogs();
      
      if (response.success && response.data) {
        setLogs(response.data);
      } else {
        setError(response.error || 'Failed to load bong hit logs');
      }
    } catch (err) {
      console.error('Failed to load bong hit logs:', err);
      setError('Failed to load bong hit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = async () => {
    if (isExporting) return;
    
    try {
      setIsExporting(true);
      
      // Create CSV content
      let csvContent = 'ID,Timestamp,Duration (ms)\n';
      
      logs.forEach(log => {
        csvContent += `${log.id || ''},${log.timestamp},${log.duration_ms}\n`;
      });
      
      const fileName = `bong_hit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      // Use Sharing.shareAsync directly with the file path
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Bong Hit Logs',
        UTI: 'public.comma-separated-values-text'
      });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredLogs = () => {
    if (selectedPeriod === 'all') return logs;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (selectedPeriod === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    }
    
    return logs.filter(log => new Date(log.timestamp) >= cutoffDate);
  };

  const filteredLogs = getFilteredLogs();
  
  const avgDuration = filteredLogs.length > 0 
    ? filteredLogs.reduce((sum, log) => sum + log.duration_ms, 0) / (filteredLogs.length * 1000)
    : 0;

  const avgIntensity = filteredLogs.length > 0 && filteredLogs.some(log => log.intensity !== undefined)
    ? filteredLogs.reduce((sum, log) => sum + (log.intensity || 0), 0) / 
      filteredLogs.filter(log => log.intensity !== undefined).length
    : 0;

  const renderLogItem = ({ item }: { item: BongHit }) => {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();
    const durationSec = (item.duration_ms / 1000).toFixed(1);
    
    return (
      <View style={styles.logItem}>
        <LinearGradient
          colors={['rgba(0, 230, 118, 0.05)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.logHeader}>
          <Text style={styles.logTime}>{formattedTime}</Text>
          <Text style={styles.logDate}>{formattedDate}</Text>
        </View>
        <View style={styles.logContent}>
          <View style={styles.logDetail}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={COLORS.primary} />
            <Text style={styles.logDetailText}>{durationSec}s</Text>
          </View>
          {item.intensity && (
            <View style={styles.logDetail}>
              <MaterialCommunityIcons name="fire" size={16} color={COLORS.primary} />
              <Text style={styles.logDetailText}>Intensity: {item.intensity}</Text>
            </View>
          )}
        </View>
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error} />;
  }

  return (
    <SafeAreaProvider>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons 
            name="chevron-left" 
            size={28} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bong Hit Logs</Text>
        <TouchableOpacity 
          onPress={exportToCSV}
          disabled={isExporting}
          style={styles.exportButton}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <MaterialCommunityIcons name="export" size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.container}>
        {/* Main Stats Card */}
        <View style={styles.mainStatsCard}>
          <View style={styles.averageContainer}>
            <Text style={styles.averageLabel}>Total Hits Recorded</Text>
            <Text style={styles.averageValue}>{filteredLogs.length}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{avgDuration.toFixed(1)}s</Text>
              <Text style={styles.statLabel}>Avg Duration</Text>
            </View>
            <View style={styles.statDivider} />
            {avgIntensity > 0 && (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{avgIntensity.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Avg Intensity</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Time Period Selector */}
        <View style={styles.timeRangeContainer}>
          <Text style={styles.sectionTitle}>Time Period</Text>
          <View style={styles.timeRangeButtons}>
            {(['all', 'month', 'week'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.timeRangeButton,
                  selectedPeriod === period && styles.timeRangeButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.timeRangeButtonText,
                  selectedPeriod === period && styles.timeRangeButtonTextActive
                ]}>
                  {period === 'all' ? 'All Time' : 
                   period === 'month' ? 'Past Month' : 'Past Week'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logs List Section */}
        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>
            {selectedPeriod === 'all' ? 'All Logs' : 
             selectedPeriod === 'month' ? 'Logs (Past Month)' : 
             'Logs (Past Week)'}
            <Text style={styles.logsCount}> • {filteredLogs.length}</Text>
          </Text>
          
          <FlatList
            data={filteredLogs}
            renderItem={renderLogItem}
            keyExtractor={(item) => (item.id ? item.id.toString() : item.timestamp)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons 
                  name="playlist-remove" 
                  size={48} 
                  color={COLORS.text.tertiary} 
                />
                <Text style={styles.emptyText}>No logs found for this period</Text>
              </View>
            }
          />
        </View>
      </View>
    </SafeAreaProvider>
  );
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
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.35,
    marginLeft: 12,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  mainStatsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  averageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  averageLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  averageValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeRangeContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  timeRangeButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  logsCount: {
    fontWeight: '400',
    color: COLORS.text.secondary,
  },
  listContent: {
    paddingBottom: 16,
  },
  logItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  logTime: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  logContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  logDetailText: {
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 12,
  },
});

export default BongHitLogs;