import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SavedDevice } from '@/src/types';
import { useDeviceService } from '@/src/providers/AppProvider';
import { COLORS } from '@/src/constants';

export default function DevicesScreen() {
  const deviceService = useDeviceService();
  const [devices, setDevices] = useState<SavedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDevices = async () => {
    try {
      const savedDevices = await deviceService.getSavedDevices();
      setDevices(savedDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
      Alert.alert('Error', 'Failed to load saved devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  const handleRemoveDevice = async (device: SavedDevice) => {
    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove ${device.name || device.id}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deviceService.removeDevice(device);
              setDevices(devices.filter(d => d.id !== device.id));
            } catch (error) {
              console.error('Failed to remove device:', error);
              Alert.alert('Error', 'Failed to remove device');
            }
          },
        },
      ]
    );
  };

  const handleClearDevices = () => {
    if (devices.length === 0) return;
    
    Alert.alert(
      'Clear All Devices',
      'Are you sure you want to remove all saved devices?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deviceService.clearDevices();
              setDevices([]);
            } catch (error) {
              console.error('Failed to clear devices:', error);
              Alert.alert('Error', 'Failed to clear all devices');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SavedDevice }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        {item.lastConnected && (
          <Text style={styles.lastConnected}>
            Last connected: {new Date(item.lastConnected).toLocaleDateString()}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveDevice(item)}
      >
        <Ionicons name="trash-outline" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading saved devices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Devices</Text>
        <TouchableOpacity onPress={handleClearDevices} disabled={devices.length === 0}>
          <Text 
            style={[
              styles.clearButton, 
              devices.length === 0 ? { opacity: 0.5 } : null
            ]}
          >
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {devices.length > 0 ? (
        <FlatList
          data={devices}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bluetooth-outline" size={64} color={COLORS.text.tertiary} />
          <Text style={styles.emptyText}>No saved devices</Text>
          <Text style={styles.emptySubtext}>
            Connect to a device to save it to this list
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  clearButton: {
    color: COLORS.primary,
    fontSize: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  lastConnected: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  removeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.text.primary,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
}); 