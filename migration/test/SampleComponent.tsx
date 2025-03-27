import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { StrainService } from '../../src/services/StrainService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { AsyncStorageManager } from '../../src/database/asyncStorageManager';
import { Strain } from '../../src/types';

/**
 * Sample component that uses multiple services
 * This will be used to test our migration script
 */
export default function SampleComponent() {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data from various services
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Using StrainService
      const strainService = StrainService.getInstance();
      const popularStrains = await strainService.getPopularStrains(5);
      setStrains(popularStrains);
      
      // Using method from StrainService instance
      const strainCategories = await strainService.getStrainCategories();
      console.log('Strain categories:', strainCategories);
      
      // Using DataService - commented out to avoid type errors in this test file
      // const dataService = DatabaseService.getInstance();
      // const bongHitStats = await dataService.someMethod();
      // setStats(bongHitStats);
      
      // Using AsyncStorageManager
      const asyncStorageManager = AsyncStorageManager.getInstance();
      const isFirst = await asyncStorageManager.isFirstLaunch();
      setIsFirstLaunch(isFirst);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Sample Component</Text>
      
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