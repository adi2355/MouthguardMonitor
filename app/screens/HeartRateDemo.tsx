import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { COLORS } from '@/src/constants';
import ScrollableHeartRateChart from '../components/charts/ScrollableHeartRateChart';
import HeartRateTrendChart from '../components/charts/HeartRateTrendChart';
import Card from '../components/shared/Card';

const HeartRateDemo = () => {
  // Sample data for HeartRateTrendChart
  const heartRateData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [65, 70, 80, 75, 90, 85],
        color: (opacity = 1) => `rgba(255, 69, 58, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.backButton}>Heart</Text>
          <Text style={styles.title}>Heart Rate</Text>
          <Text style={styles.actionButton}>Add Data</Text>
        </View>
        
        {/* Apple-Style Scrollable Chart */}
        <ScrollableHeartRateChart 
          data={heartRateData}
          currentValue={55}
          timestamp="09:34"
          height={350}
          rangeData={{
            min: 47,
            max: 179,
            timeRange: "Dec 29, 2024 - Jun 28, 2025"
          }}
        />
        
        {/* Highlights Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Highlights</Text>
          <Text style={styles.sectionAction}>Show All</Text>
        </View>
        
        {/* Highlight Card */}
        <Card style={styles.highlightCard}>
          <View style={styles.highlightHeader}>
            <View style={styles.heartIconContainer}>
              <Text style={styles.heartIcon}>❤️</Text>
            </View>
            <Text style={styles.highlightTitle}>Heart Rate: Workout</Text>
          </View>
          
          <Text style={styles.highlightDescription}>
            Your heart rate was 99–176 beats per minute during your recent workout.
          </Text>
          
          <View style={styles.divider} />
          
          {/* Heart Rate Trend in Highlight Card */}
          <HeartRateTrendChart 
            data={heartRateData}
            avgHr={131}
            minHr={99}
            maxHr={176}
            height={180}
          />
          
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>17:40</Text>
            <Text style={styles.timeLabel}>18:40</Text>
          </View>
        </Card>
        
        {/* About Heart Rate Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About Heart Rate</Text>
        </View>
        
        <Card style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            Your heart beats approximately 100,000 times per day, accelerating and slowing through periods of rest and exertion. Your heart rate refers to how many times your heart beats per minute and can be an indicator of your overall cardiovascular health and fitness level.
          </Text>
        </Card>
        
        {/* Tab bar simulation */}
        <View style={styles.tabBar}>
          <View style={styles.tabItem}>
            <Text style={styles.tabIcon}>♡</Text>
            <Text style={styles.tabLabel}>Summary</Text>
          </View>
          <View style={styles.tabItem}>
            <Text style={styles.tabIcon}>👥</Text>
            <Text style={styles.tabLabel}>Sharing</Text>
          </View>
          <View style={[styles.tabItem, styles.activeTab]}>
            <Text style={[styles.tabIcon, styles.activeTabIcon]}>☰</Text>
            <Text style={[styles.tabLabel, styles.activeTabLabel]}>Browse</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    color: '#0A84FF',
    fontSize: 17,
    fontWeight: '500',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  actionButton: {
    color: '#0A84FF',
    fontSize: 17,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionAction: {
    color: '#0A84FF',
    fontSize: 17,
    fontWeight: '500',
  },
  highlightCard: {
    backgroundColor: '#1C1C1E',
    borderColor: 'rgba(56, 56, 58, 0.8)',
    marginHorizontal: 16,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heartIconContainer: {
    marginRight: 8,
  },
  heartIcon: {
    fontSize: 22,
  },
  highlightTitle: {
    color: '#FF453A',
    fontSize: 18,
    fontWeight: '600',
  },
  highlightDescription: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(56, 56, 58, 0.8)',
    marginBottom: 16,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  aboutCard: {
    backgroundColor: '#1C1C1E',
    borderColor: 'rgba(56, 56, 58, 0.8)',
    marginHorizontal: 16,
  },
  aboutText: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 24,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderColor: 'rgba(56, 56, 58, 0.8)',
    backgroundColor: '#000',
    marginTop: 40,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 22,
    color: '#8E8E93',
    marginBottom: 4,
  },
  tabLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },
  activeTab: {},
  activeTabIcon: {
    color: '#0A84FF',
  },
  activeTabLabel: {
    color: '#0A84FF',
  },
});

export default HeartRateDemo; 