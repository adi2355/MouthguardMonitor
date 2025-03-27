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
import { Strain } from "@/src/types";
import { databaseManager } from '../../src/DatabaseManager';

const PopularStrains = () => {
  const router = useRouter();
  const [strains, setStrains] = useState<Strain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStrains = async () => {
      try {
        setLoading(true);
        const popularStrains = await databaseManager.getPopularStrains();
        setStrains(popularStrains);
      } catch (error) {
        console.error('Failed to load popular strains', error);
      } finally {
        setLoading(false);
      }
    };

    loadStrains();
  }, []);

  const renderItem = ({ item }: { item: Strain }) => (
    <TouchableOpacity 
      style={styles.strainItem}
      onPress={() => item.id && router.push({pathname: `/strains/${item.id}`} as any)}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="cannabis" size={24} color="#fff" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.strainName}>{item.name}</Text>
        <Text style={styles.strainDescription}>{item.overview}</Text>
        {item.thc_range && (
          <Text style={styles.thcContent}>THC: {item.thc_range}</Text>
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
        keyExtractor={item => item.id ? item.id.toString() : ''}
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