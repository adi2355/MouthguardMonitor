import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/src/constants";

export default function MedicalCard() {
  return (
    <View style={styles.medicalCard}>
      <LinearGradient
        colors={[
          'rgba(0,230,118,0.15)',
          'rgba(0,230,118,0.05)',
          'transparent'
        ]}
        style={styles.cardGradient}
      />
      
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons 
          name="medical-bag" 
          size={24} 
          color={COLORS.primary}
        />
        <Text style={styles.cardHeaderText}>Medical Info</Text>
      </View>

      <View style={styles.medicalStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Strain Type</Text>
          <Text style={styles.statValue}>Hybrid</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>THC Content</Text>
          <Text style={styles.statValue}>18-24%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>CBD Content</Text>
          <Text style={styles.statValue}>0.1%</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.moreDetailsButton}>
        <Text style={styles.moreDetailsText}>View Medical Details</Text>
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={20} 
          color={COLORS.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  medicalCard: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  medicalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  moreDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  moreDetailsText: {
    fontSize: 15,
    color: COLORS.primary,
  },
}); 