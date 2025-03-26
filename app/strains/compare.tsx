import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';
import { Strain } from "@/src/types";
import StrainService from '../../src/services/StrainService';

export default function CompareStrains() {
  const { ids } = useLocalSearchParams();
  const strainIds = typeof ids === 'string' ? ids.split(',') : [];
  
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, padding: 20 }}>
      <Text style={{ color: COLORS.text.primary, fontSize: 18 }}>
        Compare Strains
      </Text>
      <Text style={{ color: COLORS.text.secondary, marginTop: 8 }}>
        Comparing IDs: {strainIds.join(', ')}
      </Text>
    </View>
  );
}