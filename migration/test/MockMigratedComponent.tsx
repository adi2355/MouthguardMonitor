import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { databaseManager } from '../../src/DatabaseManager';
import { Strain } from '../../src/types';

/**
 * Sample migrated component that uses the consolidated DatabaseManager
 * Shows what the component should look like after migration
 */
export default function MockMigratedComponent() {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data from consolidated DatabaseManager
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Using DatabaseManager for strain operations
      const popularStrains = await databaseManager.getPopularStrains(5);
      setStrains(popularStrains);
      
      // Using DatabaseManager for strain categories
      const strainCategories = await databaseManager.getStrainCategories();
      console.log('Strain categories:', strainCategories);
      
      // Using DatabaseManager for AsyncStorage operations
      const isFirst = await databaseManager.isFirstLaunch();
      setIsFirstLaunch(isFirst);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Migrated Component</Text>
      
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Text style={{ marginBottom: 10 }}>First Launch: {isFirstLaunch ? 'Yes' : 'No'}</Text>
          
          <Text style={{ marginBottom: 10 }}>Popular Strains:</Text>
          <FlatList
            data={strains}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              <View style={{ padding: 10, marginBottom: 5, backgroundColor: '#f0f0f0' }}>
                <Text>{item.name}</Text>
                <Text>Type: {item.genetic_type}</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
} 