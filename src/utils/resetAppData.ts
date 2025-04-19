
// This file is auto-generated to clear AsyncStorage on next app launch
// It should be imported in app/_layout.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearAppData() {
  console.log('[AppReset] Clearing AsyncStorage...');
  try {
    await AsyncStorage.clear();
    console.log('[AppReset] AsyncStorage cleared successfully');
    // Delete the DB version key so migrations run again
    await AsyncStorage.removeItem('dbVersion');
    console.log('[AppReset] Database version reset');
    return true;
  } catch (error) {
    console.error('[AppReset] Error clearing AsyncStorage:', error);
    return false;
  }
}
