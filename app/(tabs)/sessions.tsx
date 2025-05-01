import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, ScrollView } from 'react-native';
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
    try {
      // First check if timestamp is valid
      if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
        console.warn(`[SessionCard] Invalid timestamp: ${timestamp}`);
        return 'Invalid Date';
      }
      
      const date = new Date(timestamp);
      
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        console.warn(`[SessionCard] Could not create valid date from timestamp: ${timestamp}`);
        return 'Invalid Date';
      }
      
      // Format date string using locale settings
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error(`[SessionCard] Error formatting date from timestamp ${timestamp}:`, error);
      return 'Invalid Date';
    }
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
    if (!sessionRepository) {
      console.log('[Sessions] sessionRepository not available');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      console.log('[Sessions] Loading sessions...');
      // Only set loading to true if it's not a pull-to-refresh
      if (!refreshing) {
        setLoading(true);
      }
      
      const allSessions = await sessionRepository.getAllSessions(50);
      console.log(`[Sessions] Loaded ${allSessions.length} sessions`);
      setSessions(allSessions);
    } catch (error) {
      console.error('[Sessions] Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionRepository, refreshing]);

  useEffect(() => {
    console.log('[Sessions] Initial load');
    loadSessions();
  }, [loadSessions]);

  const handleSessionSelect = (session: Session) => {
    router.push({
      pathname: '/(tabs)/reportsDetailed',
      params: { sessionId: session.id }
    });
  };

  const handleRefresh = useCallback(() => {
    console.log('[Sessions] Refresh triggered');
    setRefreshing(true);
    loadSessions();
  }, [loadSessions]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.centeredContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </SafeAreaView>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <LinearGradient
        colors={['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.03)']}
        style={[styles.emptyStateIcon, { borderRadius: 30 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name="calendar-clock" size={36} color={THEME.text.tertiary} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Sessions Yet</Text>
      <Text style={styles.emptyText}>
        Start a new session from the dashboard to begin tracking data.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
            progressBackgroundColor={THEME.cardBackground}
          />
        }
      >
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(0,176,118,0.15)', 'rgba(0,176,118,0.05)', 'transparent']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Sessions</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          View data from previous monitoring sessions
        </Text>
        
        {sessions.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.listContainer}>
            {sessions.map(session => (
              <SessionCard 
                key={session.id}
                session={session} 
                onSelect={handleSessionSelect}
                isActive={activeSession?.id === session.id}
              />
            ))}
          </View>
        )}
        
        {/* Bottom spacer for tab navigation */}
        <View style={{ height: 20 + insets.bottom }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: THEME.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: THEME.text.secondary,
  },
  // Premium header styling
  header: {
    height: 140,
    position: 'relative',
    marginBottom: 10,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.text.secondary,
    marginBottom: 20,
  },
  listContainer: {
    paddingTop: 8,
    marginBottom: 12,
  },
  // Session card styles
  card: {
    backgroundColor: THEME.cardBackground,
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
    backgroundColor: 'rgba(0, 176, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 176, 118, 0.3)',
  },
  activeBadgeText: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '600',
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.divider,
    paddingTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: THEME.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
  },
}); 