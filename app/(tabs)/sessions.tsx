import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Session } from '@/src/types';
import { useSession } from '@/src/contexts/SessionContext';
import { useSessionRepository } from '@/src/providers/AppProvider';
import { COLORS } from '@/src/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SessionCard = ({ session, onSelect, isActive }: { 
  session: Session; 
  onSelect: (session: Session) => void;
  isActive: boolean;
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDuration = (start: number, end?: number) => {
    if (!end) return 'In progress';
    
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, isActive && styles.activeCard]} 
      onPress={() => onSelect(session)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.sessionName}>{session.name}</Text>
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="calendar-clock" size={18} color={COLORS.primary} />
          <Text style={styles.detailText}>{formatDate(session.startTime)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="timer-outline" size={18} color={COLORS.primary} />
          <Text style={styles.detailText}>
            {getDuration(session.startTime, session.endTime)}
          </Text>
        </View>
        
        {session.team && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-group" size={18} color={COLORS.primary} />
            <Text style={styles.detailText}>{session.team}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
};

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const sessionRepository = useSessionRepository();
  const { activeSession } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const allSessions = await sessionRepository.getAllSessions(50);
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionRepository]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSessionSelect = (session: Session) => {
    router.push({
      pathname: '/(tabs)/reportsDetailed',
      params: { sessionId: session.id }
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.centeredContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </SafeAreaView>
    );
  }

  if (sessions.length === 0) {
    return (
      <SafeAreaView style={[styles.centeredContainer, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons name="calendar-remove" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>No Sessions Yet</Text>
        <Text style={styles.emptyText}>
          Start a new session from the dashboard to begin tracking data.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Text style={styles.title}>Session History</Text>
      <Text style={styles.subtitle}>
        View data from previous monitoring sessions
      </Text>
      
      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SessionCard 
            session={item} 
            onSelect={handleSessionSelect}
            isActive={activeSession?.id === item.id}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: 20 + insets.bottom }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewDetailsText: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
}); 