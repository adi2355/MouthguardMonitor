import React from 'react';
import { View, Text } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/src/constants';

export default function StrainDetailsRedirect() {
  const { id } = useLocalSearchParams();
  return <Redirect href={`/dataOverviews/strains/strainDetails?id=${id}`} />;
}