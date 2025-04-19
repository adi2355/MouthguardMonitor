import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  COLORS, 
  SAMPLE_ATHLETES, 
  SAMPLE_IMPACT_EVENTS, 
  SAMPLE_SESSIONS 
} from '@/src/constants';

// Create derived report data based on our sample data
const REPORTS = [
  ...SAMPLE_SESSIONS.map(session => ({
    id: session.id,
    title: session.name,
    date: new Date(session.startTime).toLocaleDateString(),
    type: 'Session',
    status: 'Generated',
    details: `Team: ${session.team}, Duration: ${Math.round((session.endTime - session.startTime) / (60 * 1000))} min`
  })),
  ...SAMPLE_ATHLETES.filter(athlete => athlete.deviceId).map(athlete => ({
    id: `report_${athlete.id}`,
    title: `${athlete.name} Report`,
    date: new Date().toLocaleDateString(),
    type: 'Individual',
    status: 'Generated',
    details: `Team: ${athlete.team}, Position: ${athlete.position}`
  })),
  {
    id: 'team_report_1',
    title: 'Team Impact Analysis',
    date: new Date().toLocaleDateString(),
    type: 'Team',
    status: 'Generated',
    details: `${SAMPLE_IMPACT_EVENTS.length} impacts recorded`
  }
];

type ReportType = 'Team' | 'Individual' | 'Session' | 'All';

// Custom theme colors for beige theme - matching the dashboard
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
  }
};

// Premium Glass Card component
const GlassCard = ({ style, children, intensity = 15 }) => {
  return Platform.OS === 'ios' ? (
    <BlurView intensity={intensity} tint="light" style={[styles.glassCard, style]}>
      {children}
    </BlurView>
  ) : (
    <View style={[styles.glassCardFallback, style]}>
      {children}
    </View>
  );
};

export default function ReportsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<ReportType>('All');
  const [reportData, setReportData] = useState(REPORTS);
  
  const filterOptions: ReportType[] = ['All', 'Team', 'Individual', 'Session'];
  
  const filteredReports = selectedFilter === 'All' 
    ? reportData 
    : reportData.filter(report => report.type === selectedFilter);
  
  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header with Gradient */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(0,176,118,0.15)', 'rgba(0,176,118,0.05)', 'transparent']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Reports</Text>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={() => {/* Generate report action */}}
            >
              <LinearGradient
                colors={['#00d68f', '#00b076']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                borderRadius={24}
              />
              <MaterialCommunityIcons name="file-plus-outline" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Filter Options */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filterOptions.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterOption,
                selectedFilter === option && styles.filterOptionSelected
              ]}
              onPress={() => setSelectedFilter(option)}
            >
              <Text 
                style={[
                  styles.filterOptionText,
                  selectedFilter === option && styles.filterOptionTextSelected
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Reports List */}
        <GlassCard style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {selectedFilter === 'All' ? 'All Reports' : `${selectedFilter} Reports`}
              </Text>
            </View>
            
            {filteredReports.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="file-document-outline" size={40} color={THEME.text.tertiary} />
                <Text style={styles.emptyStateText}>No reports found</Text>
                <Text style={styles.emptyStateSubtext}>Generate a report to get started</Text>
              </View>
            ) : (
              <View>
                {filteredReports.map((report, index) => (
                  <TouchableOpacity 
                    key={report.id} 
                    activeOpacity={0.7}
                    style={[
                      styles.reportItem,
                      index < filteredReports.length - 1 && styles.reportItemBorder
                    ]}
                    onPress={() => {/* Open report action */}}
                  >
                    <LinearGradient
                      colors={[
                        report.type === 'Team' 
                          ? 'rgba(0,176,118,0.15)' 
                          : report.type === 'Individual' 
                            ? 'rgba(0,122,255,0.15)' 
                            : 'rgba(255,149,0,0.15)',
                        'rgba(255,255,255,0.05)'
                      ]}
                      style={styles.reportTypeIndicator}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      borderRadius={20}
                    >
                      <MaterialCommunityIcons 
                        name={
                          report.type === 'Team' 
                            ? "account-group" 
                            : report.type === 'Individual' 
                              ? "account" 
                              : "timer-outline"
                        } 
                        size={24} 
                        color={THEME.primary} 
                      />
                    </LinearGradient>
                    
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <Text style={styles.reportDetails}>
                        {report.date} • {report.type} Report
                      </Text>
                      {report.details && (
                        <Text style={styles.reportSubdetails}>{report.details}</Text>
                      )}
                    </View>
                    
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={24} 
                      color={THEME.text.tertiary} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </GlassCard>
        
        {/* Impact Events Section */}
        <GlassCard style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Impact Events</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {SAMPLE_IMPACT_EVENTS.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="shield-alert-outline" size={40} color={THEME.text.tertiary} />
                <Text style={styles.emptyStateText}>No impact events recorded</Text>
              </View>
            ) : (
              <View>
                {SAMPLE_IMPACT_EVENTS.map((impact, index) => {
                  // Find the athlete for this impact
                  const athlete = SAMPLE_ATHLETES.find(a => a.id === impact.athleteId);
                  const formattedDate = new Date(impact.timestamp).toLocaleString();
                  
                  return (
                    <TouchableOpacity 
                      key={index} 
                      activeOpacity={0.7}
                      style={[
                        styles.impactItem,
                        index < SAMPLE_IMPACT_EVENTS.length - 1 && styles.impactItemBorder
                      ]}
                      onPress={() => {/* View impact details */}}
                    >
                      <View style={[
                        styles.severityIndicator, 
                        { backgroundColor: getSeverityColor(impact.severity || 'moderate') }
                      ]} />
                      
                      <View style={styles.impactInfo}>
                        <Text style={styles.impactTitle}>
                          {impact.magnitude.toFixed(1)}g Impact
                        </Text>
                        <Text style={styles.impactAthlete}>
                          {athlete ? athlete.name : 'Unknown Athlete'}
                        </Text>
                        <Text style={styles.impactTime}>{formattedDate}</Text>
                        
                        <View style={styles.impactCoordinates}>
                          <Text style={styles.coordinateText}>X: {impact.x.toFixed(1)}</Text>
                          <Text style={styles.coordinateText}>Y: {impact.y.toFixed(1)}</Text>
                          <Text style={styles.coordinateText}>Z: {impact.z.toFixed(1)}</Text>
                        </View>
                      </View>
                      
                      <MaterialCommunityIcons 
                        name="chevron-right" 
                        size={20} 
                        color={THEME.text.tertiary} 
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </GlassCard>
        
        {/* Create New Report Section */}
        <GlassCard style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Create New Report</Text>
            </View>
            
            <View style={styles.reportTypeGrid}>
              {[
                {
                  icon: "account-group",
                  title: "Team Report",
                  description: "Comprehensive overview of all athlete data"
                },
                {
                  icon: "account",
                  title: "Individual Report",
                  description: "Detailed analysis of a single athlete"
                },
                {
                  icon: "timer-outline",
                  title: "Session Report",
                  description: "Data from a specific practice or game"
                },
                {
                  icon: "chart-timeline-variant",
                  title: "Custom Report",
                  description: "Create a report with custom parameters"
                }
              ].map((reportType, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.reportTypeCard}
                >
                  <LinearGradient
                    colors={['rgba(0,176,118,0.15)', 'rgba(0,176,118,0.05)']}
                    style={styles.reportTypeIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    borderRadius={24}
                  >
                    <MaterialCommunityIcons 
                      name={reportType.icon} 
                      size={32} 
                      color={THEME.primary} 
                    />
                  </LinearGradient>
                  <Text style={styles.reportTypeTitle}>{reportType.title}</Text>
                  <Text style={styles.reportTypeDescription}>
                    {reportType.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </GlassCard>
        
        {/* Bottom tab spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

// Helper function to get color based on impact severity
function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'severe':
      return '#ff3b30'; // Red
    case 'moderate':
      return '#ff9500'; // Orange
    case 'mild':
      return '#00b076'; // Green
    default:
      return '#00b076'; // Green
  }
}

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
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text.primary,
    letterSpacing: 0.5,
  },
  generateButton: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  filterOptionSelected: {
    backgroundColor: THEME.primary,
    borderColor: 'rgba(0,176,118,0.2)',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.text.secondary,
  },
  filterOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  // Glass card styles
  glassCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: THEME.card.border,
    borderWidth: 1,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  glassCardFallback: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: THEME.cardBackground,
    borderColor: THEME.card.border,
    borderWidth: 1,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardInner: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
    letterSpacing: 0.3,
  },
  viewAllLink: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 8,
    color: THEME.text.tertiary,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: THEME.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  reportItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  reportTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,176,118,0.2)',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 2,
  },
  reportDetails: {
    fontSize: 14,
    color: THEME.text.secondary,
    marginBottom: 2,
  },
  reportSubdetails: {
    fontSize: 12,
    color: THEME.text.tertiary,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  impactItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  impactInfo: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 2,
  },
  impactAthlete: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.text.secondary,
    marginBottom: 2,
  },
  impactTime: {
    fontSize: 12,
    color: THEME.text.tertiary,
    marginBottom: 4,
  },
  impactCoordinates: {
    flexDirection: 'row',
    marginTop: 4,
  },
  coordinateText: {
    fontSize: 12,
    color: THEME.text.tertiary,
    marginRight: 12,
  },
  reportTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  reportTypeCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.card.border,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,176,118,0.2)',
  },
  reportTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  reportTypeDescription: {
    fontSize: 12,
    color: THEME.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});