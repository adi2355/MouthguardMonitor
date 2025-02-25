import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants';

// Gradient configurations
const gradients = {
  header: ['rgba(0,230,118,0.15)', 'rgba(0,230,118,0.05)', 'transparent'] as const,
};

const Header = memo(() => (
  <View style={styles.headerSection}>
    <LinearGradient
      colors={gradients.header}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    />
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>Summary</Text>
      <View style={styles.profileContainer}>
        <MaterialCommunityIcons 
          name="account" 
          size={24} 
          color={COLORS.primary}
        />
      </View>
    </View>
  </View>
));

const styles = StyleSheet.create({
  headerSection: {
    height: 120,
    position: 'relative',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    marginBottom: 24,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
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
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,230,118,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
});

export default Header;