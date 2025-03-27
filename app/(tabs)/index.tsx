import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert
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
  const [stats, setStats] = useState<BongHitStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<Datapoint[] | null>(null);
  
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
  
  // Load initial data
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get stats from the past 7 days
      const stats = await bongHitsRepository.getBongHitStats(7);
      setStats(stats);
      
      // Get hits per day for the past week
      const hitsPerDayResponse = await bongHitsRepository.getHitsPerDay(7);
      if (hitsPerDayResponse.success) {
        // Fix: Add null coalescing operator for undefined data
        setWeeklyData(hitsPerDayResponse.data ?? null);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load bong hit data');
    } finally {
      setLoading(false);
    }
  };
  
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
      loadData();
      
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
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
  };
  
  const renderWeeklyData = () => {
    if (!weeklyData) return null;
    
    const maxValue = Math.max(...weeklyData.map(item => item.y));
    const barHeight = 100; // Max height for bars in pixels
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Overview</Text>
        <View style={styles.chartContent}>
          {weeklyData.map((item, index) => (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.barValue}>{item.y}</Text>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: maxValue > 0 ? (item.y / maxValue) * barHeight : 0,
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
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={EXTENDED_COLORS.primary} />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : (
          <>
            {stats && (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Average Duration</Text>
                  <Text style={styles.statValue}>
                    {formatDuration(stats.averageDuration)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Longest Hit</Text>
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
    paddingBottom: 40,
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
  },
  recordingButton: {
    backgroundColor: EXTENDED_COLORS.error,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: EXTENDED_COLORS.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: EXTENDED_COLORS.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: EXTENDED_COLORS.text.secondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: EXTENDED_COLORS.text.primary,
  },
  chartContainer: {
    backgroundColor: EXTENDED_COLORS.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
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
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
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
  },
  viewMoreText: {
    fontSize: 14,
    color: EXTENDED_COLORS.primary,
    marginRight: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: EXTENDED_COLORS.cardBackground,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: EXTENDED_COLORS.text.primary,
  },
});