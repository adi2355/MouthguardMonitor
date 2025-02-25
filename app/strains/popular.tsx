import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { Strain } from '../../src/dbManager';
import StrainService from '../../src/services/StrainService';

// Define strain type
interface Strain {
  id: string;
  name: string;
  description: string;
  thcContent?: string;
  type: 'sativa' | 'indica' | 'hybrid';
}

// Sample data
const strains: Strain[] = [
  { 
    id: '1', 
    name: 'Blue Dream', 
    description: 'Hybrid strain with sweet berry aroma',
    thcContent: '18-24%',
    type: 'hybrid'
  },
  { 
    id: '2', 
    name: 'OG Kush', 
    description: 'Classic strain with earthy pine scent',
    thcContent: '20-25%',
    type: 'hybrid'
  },
  { 
    id: '3', 
    name: 'Gorilla Glue', 
    description: 'Powerful hybrid with diesel notes',
    thcContent: '25-28%',
    type: 'hybrid'
  },
  { 
    id: '4', 
    name: 'Gelato', 
    description: 'Sweet and creamy hybrid strain',
    thcContent: '17-22%',
    type: 'hybrid'
  },
  { 
    id: '5', 
    name: 'Sour Diesel', 
    description: 'Energetic sativa with diesel aroma',
    thcContent: '19-25%',
    type: 'sativa'
  }
];

const PopularStrains = () => {
  const router = useRouter();

  const renderItem = ({ item }: { item: Strain }) => (
    <TouchableOpacity 
      style={styles.strainItem}
      onPress={() => router.push(`/strains/${item.id}`)}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="cannabis" size={24} color="#fff" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.strainName}>{item.name}</Text>
        <Text style={styles.strainDescription}>{item.description}</Text>
        {item.thcContent && (
          <Text style={styles.thcContent}>THC: {item.thcContent}</Text>
        )}
      </View>
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={24} 
        color={colors.label.secondary} 
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons 
            name="chevron-left" 
            size={28} 
            color={colors.label.primary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Popular Strains</Text>
      </View>
      <FlatList
        data={strains}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const colors = {
  label: {
    primary: "#FFFFFF",
    secondary: "#8E8E93",
    tertiary: "#636366",
  },
  background: {
    primary: "#000000",
    secondary: "#1C1C1E",
    tertiary: "#2C2C2E",
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerText: {
    fontSize: 24,
    fontWeight: Platform.select({ ios: '600', android: 'bold' }),
    color: colors.label.primary,
  },
  listContainer: {
    padding: 16,
  },
  strainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  strainName: {
    fontSize: 17,
    fontWeight: Platform.select({ ios: '600', android: 'bold' }),
    color: colors.label.primary,
    marginBottom: 4,
  },
  strainDescription: {
    fontSize: 14,
    color: colors.label.secondary,
    marginBottom: 4,
  },
  thcContent: {
    fontSize: 12,
    color: colors.label.tertiary,
    fontWeight: '500',
  },
});

export default PopularStrains; 