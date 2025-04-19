import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur'; // Import if using GlassCard
import { playerData } from '@/src/constants'; // Import the simulated data
import { COLORS } from '@/src/constants'; // Use your COLORS

// Re-use or adapt the GlassCard component from index.tsx or devices.tsx
// If not using GlassCard, replace with styled View components.
interface GlassCardProps {
  style?: ViewStyle;
  children: React.ReactNode;
  intensity?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({ style, children, intensity = 15 }) => {
  // Basic fallback View if BlurView/GlassCard isn't available/desired
  return <View style={[styles.glassCardFallback, style]}>{children}</View>;
};

// Define the Theme based on your constants
const THEME = {
  background: COLORS.background,
  cardBackground: COLORS.card,
  primary: COLORS.primary,
  text: {
    primary: COLORS.textPrimary,
    secondary: COLORS.textSecondary,
    tertiary: COLORS.textTertiary,
  },
  divider: 'rgba(0,0,0,0.08)',
  card: {
    shadow: 'rgba(0,0,0,0.12)',
    border: 'rgba(0,0,0,0.05)',
  },
  error: COLORS.error,
  warning: COLORS.warning,
  info: COLORS.info,
};


export default function ReportsDetailedScreen() {
  // Assuming we show details for the latest session for now
  // In a real app, you might get a session ID via params
  const sessionToShow = playerData.sessions[0];
  const stats = sessionToShow?.stats;

  const getRiskStyle = (risk: string | undefined) => {
    switch (risk?.toLowerCase()) {
      case 'high': return styles.riskHigh;
      case 'moderate': return styles.riskModerate;
      default: return styles.riskLow;
    }
  };

  const renderSessionHistoryItem = ({ item }: { item: typeof playerData.sessions[0] }) => (
    <TouchableOpacity style={styles.historyItem}>
       <View style={styles.historyIconContainer}>
         <MaterialCommunityIcons name="history" size={20} color={THEME.primary} />
       </View>
       <View style={styles.historyInfo}>
         <Text style={styles.historyTitle}>{item.type} - {item.sport}</Text>
         <Text style={styles.historyDate}>{item.date} ({item.stats.duration})</Text>
       </View>
       <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(0,176,118,0.15)', 'rgba(0,176,118,0.05)', 'transparent']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Detailed Report</Text>
            {/* Maybe add session selector here later */}
          </View>
        </View>

        {/* Session Info Card */}
        <GlassCard style={styles.card}>
           <View style={styles.cardInner}>
             <Text style={styles.cardTitle}>Session: {sessionToShow.type} ({sessionToShow.sport})</Text>
             <Text style={styles.cardSubtitle}>Date: {sessionToShow.date}</Text>
             <Text style={styles.cardSubtitle}>Duration: {stats?.duration}</Text>
           </View>
        </GlassCard>

        {/* Metrics Grid/List */}
        <View style={styles.metricsGrid}>
          {/* Heart Rate */}
          <GlassCard style={[styles.metricCard, styles.metricCardFull]}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="heart-pulse" size={28} color={THEME.primary} />
              <Text style={styles.metricLabel}>Heart Rate</Text>
              <Text style={styles.metricValue}>{stats?.heartRate?.avg ?? '--'} bpm (Avg)</Text>
              <Text style={styles.metricValueSub}>{stats?.heartRate?.max ?? '--'} bpm (Max)</Text>
            </View>
          </GlassCard>

          {/* Temperature */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="thermometer" size={28} color={THEME.primary} />
              <Text style={styles.metricLabel}>Avg Temperature</Text>
              <Text style={styles.metricValue}>{stats?.temperature ?? '--'} °F</Text>
            </View>
          </GlassCard>

          {/* Acceleration */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="run-fast" size={28} color={THEME.primary} />
              <Text style={styles.metricLabel}>Avg Acceleration</Text>
              <Text style={styles.metricValue}>{stats?.acceleration ?? '--'} mph</Text>
            </View>
          </GlassCard>

          {/* Calories Burned */}
           <GlassCard style={styles.metricCard}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="fire" size={28} color={THEME.warning} />
              <Text style={styles.metricLabel}>Calories Burned</Text>
              <Text style={styles.metricValue}>{stats?.caloriesBurned ?? '--'} kcals</Text>
            </View>
          </GlassCard>

          {/* Bite Force */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="tooth-outline" size={28} color={THEME.info} />
              <Text style={styles.metricLabel}>Bite Force</Text>
              <Text style={styles.metricValue}>{stats?.biteForce ?? '--'}</Text>
              {/* Add unit if known */}
            </View>
          </GlassCard>

          {/* Concussion Risk */}
          <GlassCard style={[styles.metricCard, styles.metricCardFull]}>
             <View style={styles.metricContent}>
               <MaterialCommunityIcons name="shield-alert-outline" size={28} color={getRiskStyle(stats?.concussionRisk).color} />
               <Text style={styles.metricLabel}>Concussion Risk</Text>
               <Text style={[styles.metricValue, getRiskStyle(stats?.concussionRisk)]}>{stats?.concussionRisk ?? 'N/A'}</Text>
             </View>
          </GlassCard>
        </View>


        {/* Session History Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={styles.cardTitle}>Session History</Text>
            <FlatList
              data={playerData.sessions}
              renderItem={renderSessionHistoryItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false} // Disable nested scroll
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </GlassCard>

        {/* Bottom Spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

// Add extensive styling - Adapt styles from index.tsx, devices.tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    height: 140, // Keep consistent header size
    position: 'relative',
    marginBottom: 20,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16, // Adjust as needed for safe area
    justifyContent: 'center', // Center title for this screen
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center', // Center align
  },
  card: { // Style for general cards
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardInner: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 8,
  },
  cardSubtitle: {
      fontSize: 14,
      color: THEME.text.secondary,
      marginBottom: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%', // Two columns layout
    marginBottom: 16,
    minHeight: 130, // Ensure cards have a minimum height
  },
  metricCardFull: {
      width: '100%', // Span full width
  },
  metricContent: {
    flex: 1, // Ensure content takes up space
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically and horizontally
    padding: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: THEME.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.text.primary,
    marginTop: 4,
    textAlign: 'center',
  },
   metricValueSub: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  riskHigh: { color: THEME.error, fontWeight: 'bold' },
  riskModerate: { color: THEME.warning, fontWeight: 'bold' },
  riskLow: { color: THEME.primary, fontWeight: 'normal' }, // Or success color
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,176,118,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  historyInfo: {
      flex: 1,
  },
  historyTitle:{
      fontSize: 15,
      fontWeight: '500',
      color: THEME.text.primary,
      marginBottom: 2,
  },
  historyDate:{
      fontSize: 13,
      color: THEME.text.secondary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.divider,
    marginVertical: 4,
  },
  // Fallback style for GlassCard if needed
  glassCardFallback: {
    borderRadius: 16,
    backgroundColor: THEME.cardBackground,
    borderColor: THEME.card.border,
    borderWidth: 1,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    // remove marginBottom if applying via parent style
  },
}); 