import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { coachData } from '@/src/constants'; // Import simulated coach/player data
import { COLORS } from '@/src/constants'; // Use your COLORS

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
};

// Define a type for Player from coachData
type Player = typeof coachData.players[0];

// Fallback Card Style (if not using GlassCard)
interface PlayerCardProps {
  style?: ViewStyle;
  children: React.ReactNode;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ style, children }) => (
  <View style={[styles.playerCard, style]}>{children}</View>
);

export default function CoachDashboardScreen() {

  const renderPlayerItem = ({ item }: { item: Player }) => {
    const latestSession = item.sessions.length > 0 ? item.sessions[0] : null;
    const concussionRisk = latestSession?.stats?.concussionRisk;
    const isHighRisk = concussionRisk === 'High';

    return (
      <TouchableOpacity style={[styles.playerRow, isHighRisk && styles.playerRowHighRisk]}>
         <LinearGradient
          // Optional gradient for the row
          colors={isHighRisk ? ['rgba(255,59,48,0.1)', 'rgba(255,59,48,0.05)'] : ['rgba(0,176,118,0.1)', 'rgba(0,176,118,0.05)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.name}</Text>
          {/* Alert indicator next to name */}
          {isHighRisk && (
              <View style={styles.alertIndicator}>
                  <MaterialCommunityIcons name="alert-decagram" size={16} color={THEME.error} />
                  <Text style={styles.alertIndicatorText}>High Risk</Text>
              </View>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.text.tertiary} />
      </TouchableOpacity>
    );
  };

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
            <Text style={styles.headerTitle}>Coach Dashboard</Text>
            {/* Add "Add Player" button if needed */}
            {/* <TouchableOpacity style={styles.addButton}>...</TouchableOpacity> */}
          </View>
        </View>

        {/* Player List */}
        <View style={styles.playerListContainer}>
            <Text style={styles.listTitle}>Players</Text>
            <FlatList
                data={coachData.players}
                renderItem={renderPlayerItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // Disable nested scroll
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

// Add Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    height: 140,
    position: 'relative',
    marginBottom: 20,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16, // Adjust as needed
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  playerListContainer: {
      marginHorizontal: 16,
      backgroundColor: THEME.cardBackground, // Container for list
      borderRadius: 16,
      padding: 16,
      // Add shadows etc. if using Card style
      borderColor: THEME.card.border,
      borderWidth: 1,
      shadowColor: THEME.card.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
  },
  listTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: THEME.text.primary,
      marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: 'hidden', // For gradient
    position: 'relative',
    // backgroundColor: 'rgba(0,176,118,0.05)', // Default green tint
  },
   playerRowHighRisk: {
     // Optional: Add specific style for high risk rows if needed beyond gradient
     // borderColor: THEME.error,
     // borderWidth: 1,
   },
  playerInfo: {
    flex: 1,
    flexDirection: 'row', // Arrange name and alert horizontally
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text.primary,
  },
  alertIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
      backgroundColor: 'rgba(255, 59, 48, 0.15)', // Red tint background
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
  },
  alertIndicatorText: {
      color: THEME.error,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.divider,
    marginVertical: 4,
  },
  // Fallback player card style
   playerCard: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
}); 