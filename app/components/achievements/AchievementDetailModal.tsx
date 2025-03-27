import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAchievementWithDetails } from '../../../src/types';
import { COLORS } from '../../../src/constants';

interface AchievementDetailModalProps {
  visible: boolean;
  achievement: UserAchievementWithDetails | null;
  onClose: () => void;
}

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({ 
  visible, 
  achievement, 
  onClose 
}) => {
  if (!achievement) return null;
  
  const { name, category, unlockCondition, notes, progress, isUnlocked, dateUnlocked, icon, complexity } = achievement;
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not yet unlocked';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  const renderComplexityStars = (level: number) => {
    return Array(3).fill(0).map((_, index) => (
      <MaterialCommunityIcons 
        key={index} 
        name="star" 
        size={16} 
        color={index < Math.min(level, 3) ? COLORS.primary : 'rgba(255, 255, 255, 0.2)'} 
        style={{ marginRight: 2 }}
      />
    ));
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <LinearGradient
              colors={[
                'rgba(0,230,118,0.2)',
                'rgba(0,230,118,0.05)',
                'transparent'
              ]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(0,230,118,0.3)', 'rgba(0,230,118,0.2)']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons 
                  name={icon as any || 'trophy'} 
                  size={40} 
                  color={isUnlocked ? COLORS.primary : COLORS.text.secondary} 
                />
              </LinearGradient>
            </View>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            <Text style={styles.title}>{name}</Text>
            
            <View style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>{category}</Text>
              <View style={styles.complexityContainer}>
                {renderComplexityStars(complexity)}
              </View>
            </View>
            
            {!isUnlocked && (
              <View style={styles.progressSection}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${Math.min(100, progress)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                </View>
              </View>
            )}
            
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>How to unlock</Text>
              <Text style={styles.detailText}>{unlockCondition}</Text>
            </View>
            
            {notes && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Details</Text>
                <Text style={styles.detailText}>{notes}</Text>
              </View>
            )}
            
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.statusRow}>
                <MaterialCommunityIcons 
                  name={isUnlocked ? "check-circle" : "clock-outline"} 
                  size={18} 
                  color={isUnlocked ? COLORS.primary : COLORS.text.secondary} 
                  style={styles.statusIcon}
                />
                <Text style={styles.statusText}>
                  {isUnlocked 
                    ? `Unlocked on ${formatDate(dateUnlocked)}` 
                    : 'Not yet unlocked'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Platform.select({
      ios: 'rgba(26, 26, 26, 0.95)',
      android: 'rgba(26, 26, 26, 0.98)',
    }),
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    marginBottom: 8,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.35,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  complexityContainer: {
    flexDirection: 'row',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    letterSpacing: 0.25,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});