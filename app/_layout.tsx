import { clearAppData } from '../src/utils/resetAppData';
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { BluetoothHandler, BluetoothContext } from "@/src/contexts/BluetoothContext";
import { useColorScheme, AppState, AppStateStatus, Alert, Text, View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { AppProvider } from '@/src/providers/AppProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SimpleApp from '../src/SimpleApp'; // Import the simple app
import { COLORS } from '@/src/constants';
// Import our custom theme wrapper
import ThemeWrapper from './components/shared/ThemeWrapper';
import AlertOverlay from './components/shared/AlertOverlay';

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

// Use this for testing - set to true to use the SimpleApp
const USE_SIMPLE_APP = false; // Toggle this to use SimpleApp directly

export default function RootLayout() {
  console.log("[RootLayout] Initializing...");
  
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [didReset, setDidReset] = useState(false);
  const [appState, setAppState] = useState<string>('loading');
  const [useSimpleApp, setUseSimpleApp] = useState(USE_SIMPLE_APP);
  
  console.log("[RootLayout] Initial state - loaded:", loaded, "error:", error);

  // Set a timeout to show SimpleApp if initialization takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!didReset) {
        console.log("[RootLayout] Initialization timeout - switching to SimpleApp");
        setUseSimpleApp(true);
        setDidReset(true); // Force app to continue
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timer);
  }, [didReset]);

  // Force a reset on every app launch
  useEffect(() => {
    async function forceReset() {
      if (USE_SIMPLE_APP) {
        // If we're using simple app, skip the reset
        console.log("[RootLayout] Using SimpleApp, skipping reset");
        setDidReset(true);
        return;
      }
      
      try {
        console.log("[RootLayout] Checking reset status...");
        setAppState('checking-reset');
        
        // Use a specific version-keyed reset flag to control app resets
        const RESET_PERFORMED_KEY = 'APP_RESET_V1_PERFORMED';
        const resetPerformed = await AsyncStorage.getItem(RESET_PERFORMED_KEY);
        
        if (!resetPerformed) {
          // Only reset if not done before
          console.log("[RootLayout] Reset not performed yet, starting app reset...");
          setAppState('resetting');
          
          // Perform the actual reset
          const resetResult = await clearAppData();
          console.log("[RootLayout] Reset completed with result:", resetResult);
          
          if (resetResult) {
            // Mark reset as performed only if successful
            await AsyncStorage.setItem(RESET_PERFORMED_KEY, 'true');
            console.log("[RootLayout] App data cleared and reset marked as performed.");
          }
          
          setDidReset(true);
          setAppState('reset-complete');
          console.log("[RootLayout] App reset completed successfully");
        } else {
          // Reset already performed, skip
          console.log("[RootLayout] Reset already performed, skipping reset process");
          setDidReset(true);
          setAppState('no-reset-needed');
        }
      } catch (err) {
        console.error('[RootLayout] Error during app reset check:', err);
        setAppState('reset-error');
        Alert.alert(
          'Reset Error',
          'There was an error checking app reset status. Try restarting the app.',
          [{ text: 'OK' }]
        );
        setDidReset(true); // Continue anyway to prevent blocking the app
      }
    }
    
    forceReset();
    
    return () => {
      console.log("[RootLayout] Cleanup effect");
    };
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    console.log("[RootLayout] Error effect triggered, error:", error);
    if (error) {
      console.error("[RootLayout] Font loading error:", error);
      setAppState('font-error');
      throw error;
    }
  }, [error]);

  useEffect(() => {
    console.log("[RootLayout] Loaded effect triggered, loaded:", loaded);
    if (loaded) {
      console.log("[RootLayout] Fonts loaded, hiding splash screen");
      setAppState('fonts-loaded');
      SplashScreen.hideAsync().catch(err => {
        console.error("[RootLayout] Error hiding splash screen:", err);
      });
    }
  }, [loaded]);

  console.log("[RootLayout] Render state - loaded:", loaded, "didReset:", didReset, "appState:", appState, "useSimpleApp:", useSimpleApp);

  // Show SimpleApp if configured to do so
  if (useSimpleApp && loaded) {
    console.log("[RootLayout] Rendering SimpleApp");
    return <SimpleApp />;
  }

  if (!loaded || !didReset) {
    console.log("[RootLayout] Still loading... Showing loading screen");
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading app... {appState}</Text>
      </View>
    );
  }

  console.log("[RootLayout] Ready to render RootLayoutNav");
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  console.log("[RootLayoutNav] Initializing...");
  
  // Create the Bluetooth handler to pass to the AppProvider
  const [bluetoothHandler] = useState<BluetoothHandler>(new BluetoothHandler());

  console.log("[RootLayoutNav] Rendering navigation stack");
  return (
    <ThemeProvider value={DefaultTheme}>
      <BluetoothContext.Provider value={bluetoothHandler}>
        <AppProvider bluetoothHandler={bluetoothHandler}>
          <ThemeWrapper>
            <Stack>
              <Stack.Screen 
                name="(tabs)" 
                options={{ headerShown: false }} 
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <AlertOverlay />
          </ThemeWrapper>
        </AppProvider>
      </BluetoothContext.Provider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginTop: 10
  }
});
