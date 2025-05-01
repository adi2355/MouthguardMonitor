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

// Custom theme colors for beige theme - matching index.tsx
const THEME = {
  background: '#f2efe4', // Beige background matching bottom bar
  cardBackground: '#ffffff',
  primary: '#00b076', // Green primary color
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
  },
  divider: 'rgba(0,0,0,0.08)',
  card: {
    shadow: 'rgba(0,0,0,0.12)',
    border: 'rgba(0,0,0,0.05)',
  },
  error: COLORS.error,
  warning: COLORS.warning,
};

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
          <MaterialCommunityIcons name="calendar-clock" size={18} color={THEME.primary} />
          <Text style={styles.detailText}>{formatDate(session.startTime)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="timer-outline" size={18} color={THEME.primary} />
          <Text style={styles.detailText}>
            {getDuration(session.startTime, session.endTime)}
          </Text>
        </View>
        
        {session.team && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-group" size={18} color={THEME.primary} />
            <Text style={styles.detailText}>{session.team}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.primary} />
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
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </SafeAreaView>
    );
  }

  if (sessions.length === 0) {
    return (
      <SafeAreaView style={[styles.centeredContainer, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons name="calendar-remove" size={64} color={THEME.text.secondary} />
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
            colors={[THEME.primary]}
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
    backgroundColor: THEME.background, // Beige background
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: THEME.background, // Beige background
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: THEME.text.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.text.secondary,
    marginBottom: 16,
  },
  listContent: {
    paddingTop: 8,
  },
  card: {
    backgroundColor: THEME.cardBackground, // White card background
    borderRadius: 16,
    marginBottom: 16,
    padding: 16, 
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.card.border,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: THEME.text.secondary,
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.divider,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.primary,
    marginRight: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: THEME.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
  }
}); 