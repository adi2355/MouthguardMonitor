import AsyncStorage from '@react-native-async-storage/async-storage';

const saveDeviceId = async (deviceId: string) => {
  try {
    const storedIds = await AsyncStorage.getItem('connectedDevices');
    const updatedIds = storedIds ? JSON.parse(storedIds) : [];
    updatedIds.push(deviceId);
    await AsyncStorage.setItem('connectedDevices', JSON.stringify(updatedIds));
  } catch (error) {
    console.error('Failed to save device ID:', error);
  }
};

