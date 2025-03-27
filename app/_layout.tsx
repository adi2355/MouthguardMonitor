import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { BluetoothContext, BluetoothHandler } from "@/src/contexts/BluetoothContext";
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AchievementProvider } from './context/AchievementContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { DatabaseManager } from '@/src/DatabaseManager';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [bluetoothHandler] = useState<BluetoothHandler>(new BluetoothHandler());
  const databaseManager = DatabaseManager.getInstance();

  // Set up AppState listener for database management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to the foreground
        console.log('[App] App active, ensuring database is initialized');
        databaseManager.ensureInitialized();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App has gone to the background
        console.log('[App] App inactive/background, cleaning up database connections');
        databaseManager.cleanup();
      }
    };

    // Set up the listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initialize DB on first load
    databaseManager.ensureInitialized();

    // Clean up on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AchievementProvider>
        <BluetoothContext.Provider value={bluetoothHandler}>
          <Stack>
            <Stack.Screen 
              name="(tabs)" 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="dataOverviews/strains/strainDetails" 
              options={{ 
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }} 
            />
            <Stack.Screen name="dataOverviews/bongHitLogs" options={{ title: 'Bong Hit Logs' }} />
            <Stack.Screen name="dataOverviews/dailyAverageOverview" options={{ title: 'Daily Average' }} />
            <Stack.Screen name="dataOverviews/weeklyAverage" options={{ title: 'Weekly Average' }} />
            <Stack.Screen name="dataOverviews/weeklyOverview" options={{ title: 'Weekly Overview' }} />
            <Stack.Screen name="dataOverviews/monthlyOverview" options={{ title: 'Monthly Overview' }} />
            <Stack.Screen name="dataOverviews/strainUsage" options={{ title: 'Strain Usage' }} />
            <Stack.Screen name="screens/AchievementsScreen" options={{ title: 'Achievements' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </BluetoothContext.Provider>
      </AchievementProvider>
    </ThemeProvider>
  );
}
