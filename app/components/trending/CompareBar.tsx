import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants';
import { Strain } from '../../../src/dbManager';
import Animated, { FadeIn } from 'react-native-reanimated';

interface CompareBarProps {
  compareList: Strain[];
  onCompareToggle: (strain: Strain) => void;
  onCompare: () => void;
}

const CompareBar = memo(({
  compareList,
  onCompareToggle,
  onCompare
}: CompareBarProps) => (
  <Animated.View 
    entering={FadeIn}
    style={styles.compareBar}
  >
    <FlatList
      horizontal
      data={compareList}
      keyExtractor={item => item.id!.toString()}
      renderItem={({ item }) => (
        <View style={styles.compareItem}>
          <Text style={styles.compareItemText}>{item.name}</Text>
          <TouchableOpacity 
            onPress={() => onCompareToggle(item)}
            style={styles.compareItemRemove}
          >
            <MaterialCommunityIcons 
              name="close" 
              size={20} 
              color={COLORS.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      )}
    />
    <TouchableOpacity 
      style={[
        styles.compareButton,
        compareList.length < 2 && styles.compareButtonDisabled
      ]}
      onPress={onCompare}
      disabled={compareList.length < 2}
    >
      <Text style={styles.compareButtonText}>
        Compare ({compareList.length})
      </Text>
    </TouchableOpacity>
  </Animated.View>
));

const styles = StyleSheet.create({
  compareBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 230, 118, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  compareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  compareItemText: {
    color: COLORS.text.primary,
    fontSize: 14,
    maxWidth: 120,
    letterSpacing: 0.2,
  },
  compareItemRemove: {
    padding: 2,
  },
  compareButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    opacity: 1,
  },
  compareButtonDisabled: {
    opacity: 0.5,
  },
  compareButtonText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});

export default CompareBar; 