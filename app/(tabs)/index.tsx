import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { useBongHitsRepository } from '@/src/providers/AppProvider';
import { BongHitStats, Datapoint } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { useRouter } from 'expo-router';

// Add missing color constants
const EXTENDED_COLORS = {
  ...COLORS,
  inactive: '#555555', // Gray color for inactive bars
  error: '#FF3B30'    // Red color for the recording button when active
};

export default function HomeScreen() {
  const router = useRouter();
  const bongHitsRepository = useBongHitsRepository();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<BongHitStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<Datapoint[] | null>(null);
  const [currentWeekAverage, setCurrentWeekAverage] = useState<number>(0);
  
  // Timer interval for recording
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    
    if (isRecording && recordingStartTime) {
      timerInterval = setInterval(() => {
        const now = new Date();
        const elapsed = now.getTime() - recordingStartTime.getTime();
        setElapsedTime(elapsed);
      }, 100);
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isRecording, recordingStartTime]);
  
  // Load data function
  const loadData = useCallback(async () => {
    try {
      console.log("[HomeScreen] Loading data...");
      setLoading(true);
      
      // Get stats from the past 7 days
      const stats = await bongHitsRepository.getBongHitStats(7);
      setStats(stats);
      
      // Get hits per day for the past week
      const hitsPerDayResponse = await bongHitsRepository.getHitsPerDay(7);
      if (hitsPerDayResponse.success) {
        setWeeklyData(hitsPerDayResponse.data ?? null);
      }
      
      // Fetch average hits for the current calendar week
      const currentWeekAvgResponse = await bongHitsRepository.getAverageHitsForCurrentWeek();
      if (currentWeekAvgResponse.success) {
        setCurrentWeekAverage(currentWeekAvgResponse.data ?? 0);
      }
      
      console.log("[HomeScreen] Data loaded successfully");
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load bong hit data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bongHitsRepository]);
  
  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Handle refresh
  const onRefresh = useCallback(() => {
    console.log("[HomeScreen] Refresh triggered");
    setRefreshing(true);
    loadData();
  }, [loadData]);
  
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(new Date());
    setElapsedTime(0);
  };
  
  const handleStopRecording = async () => {
    if (!isRecording || !recordingStartTime) return;
    
    const endTime = new Date();
    const duration = endTime.getTime() - recordingStartTime.getTime();
    setIsRecording(false);
    
    try {
      // Record the bong hit
      await bongHitsRepository.recordBongHit(
        recordingStartTime.toISOString(),
        duration
      );
      
      // Refresh data
      await loadData();
      
      Alert.alert(
        'Bong Hit Recorded',
        `Duration: ${formatDuration(duration)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error recording bong hit:', error);
      Alert.alert('Error', 'Failed to record bong hit');
    }
  };
  
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    
    // Format: mm:ss.ms (e.g., 01:23.4)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${Math.floor(milliseconds / 100)}`;
  };
  
  const renderWeeklyData = () => {
    if (!weeklyData) return null;
    
    const maxValue = Math.max(...weeklyData.map(item => item.y), 1); // Ensure non-zero denominator
    const barHeight = 100; // Max height for bars in pixels
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Hits - Last 7 Days</Text>
        <View style={styles.chartContent}>
          {weeklyData.map((item, index) => (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.barValue}>{item.y}</Text>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: (item.y / maxValue) * barHeight,
                    backgroundColor: item.y > 0 ? EXTENDED_COLORS.primary : EXTENDED_COLORS.inactive
                  }
                ]} 
              />
              <Text style={styles.barLabel}>{item.x}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity 
          style={styles.viewMoreButton}
          onPress={() => router.push('/dataOverviews/weeklyOverview')}
        >
          <Text style={styles.viewMoreText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={EXTENDED_COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[EXTENDED_COLORS.primary]}
            tintColor={EXTENDED_COLORS.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Canova</Text>
        </View>
        
        <View style={styles.recordContainer}>
          <View style={styles.timerContainer}>
            {isRecording ? (
              <Text style={styles.timerText}>
                {formatDuration(elapsedTime)}
              </Text>
            ) : (
              <Text style={styles.recordPrompt}>
                Record Your Bong Hit
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording ? styles.recordingButton : {}
            ]}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
          >
            <Ionicons
              name={isRecording ? "stop" : "flame"}
              size={40}
              color="white"
            />
          </TouchableOpacity>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={EXTENDED_COLORS.primary} />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : (
          <>
            {/* Current Week Average Card */}
            <View style={styles.statCardLarge}>
              <Text style={styles.statLabelLarge}>Avg Hits/Day (This Week)</Text>
              <Text style={styles.statValueLarge}>{Math.round(currentWeekAverage)}</Text>
            </View>
            
            {stats && (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Avg Duration (Last 7d)</Text>
                  <Text style={styles.statValue}>
                    {formatDuration(stats.averageDuration)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Longest Hit (Last 7d)</Text>
                  <Text style={styles.statValue}>
                    {formatDuration(stats.longestHit)}
                  </Text>
                </View>
              </View>
            )}
            
            {renderWeeklyData()}
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/dataOverviews/bongHitLogs')}
              >
                <Ionicons name="list" size={24} color={EXTENDED_COLORS.text.primary} />
                <Text style={styles.actionButtonText}>View Logs</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/dataOverviews/dailyAverageOverview')}
              >
                <Ionicons name="stats-chart" size={24} color={EXTENDED_COLORS.text.primary} />
                <Text style={styles.actionButtonText}>Analytics</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                onPress={() => router.push('/screens/TestDataScreen')}
              >
                <Ionicons name="bug" size={24} color={EXTENDED_COLORS.text.primary} />
                <Text style={styles.actionButtonText}>Test Data</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EXTENDED_COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40, // Ensure space at the bottom
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: EXTENDED_COLORS.text.primary,
  },
  recordContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 60, // Ensure space for text
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: EXTENDED_COLORS.text.primary,
  },
  recordPrompt: {
    fontSize: 20,
    color: EXTENDED_COLORS.text.secondary,
    marginBottom: 8,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: EXTENDED_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: EXTENDED_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: EXTENDED_COLORS.error,
    shadowColor: EXTENDED_COLORS.error,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: EXTENDED_COLORS.text.secondary,
  },
  statCardLarge: {
    backgroundColor: EXTENDED_COLORS.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statLabelLarge: {
    fontSize: 16,
    color: EXTENDED_COLORS.text.secondary,
    marginBottom: 8,
  },
  statValueLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    color: EXTENDED_COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: EXTENDED_COLORS.cardBackground,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statLabel: {
    fontSize: 14,
    color: EXTENDED_COLORS.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: EXTENDED_COLORS.text.primary,
  },
  chartContainer: {
    backgroundColor: EXTENDED_COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: EXTENDED_COLORS.text.primary,
    marginBottom: 16,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '60%',
    borderRadius: 4,
    marginBottom: 8,
    minHeight: 2, // Ensure even 0-value bars are visible
  },
  barLabel: {
    fontSize: 12,
    color: EXTENDED_COLORS.text.secondary,
  },
  barValue: {
    fontSize: 12,
    color: EXTENDED_COLORS.text.secondary,
    marginBottom: 4,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: EXTENDED_COLORS.primary,
    marginRight: 4,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: EXTENDED_COLORS.cardBackground,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: EXTENDED_COLORS.text.primary,
    textAlign: 'center',
  }
});