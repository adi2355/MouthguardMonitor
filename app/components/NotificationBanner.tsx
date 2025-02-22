import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants";
import { NotificationProps } from "@/src/types";

export default function NotificationBanner({ averageHits, percentageChange, onDismiss }: NotificationProps) {
  return (
    <View style={styles.notificationContainer}>
      <View style={styles.notificationGlow} />
      <View style={styles.notificationBanner}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitle}>
            <MaterialCommunityIcons 
              name="bell-outline" 
              size={16} 
              color={COLORS.text.primary}
            />
            <Text style={styles.notificationTitleText}>Daily Summary</Text>
          </View>
          <View style={styles.notificationTime}>
            <Text style={styles.timeText}>Last 24 hours</Text>
            <TouchableOpacity 
              style={styles.dismissButtonContainer}
              onPress={onDismiss}
            >
              <Text style={[styles.dismissButton, { color: COLORS.text.tertiary }]}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.notificationContent}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={32}
            color={COLORS.text.primary}
            style={styles.earIcon}
          />
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationMainText}>
              {`Average of ${averageHits} hits per day`}
            </Text>
            <Text style={styles.notificationSubText}>
              {percentageChange > 0 
                ? 'Your daily average has increased compared to last week'
                : 'Your daily average has decreased compared to last week'
              }
            </Text>
            <TouchableOpacity>
              <Text style={styles.moreDetailsLink}>More Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  notificationGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  notificationBanner: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  notificationTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginRight: 12,
  },
  dismissButtonContainer: {
    padding: 4,
  },
  dismissButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  notificationMainText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  notificationSubText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  moreDetailsLink: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
  earIcon: {
    marginRight: 12,
  },
}); 