import 'expo-dev-client';
import 'react-native-gesture-handler';
import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { RootSiblingParent } from 'react-native-root-siblings';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from '../src/constants';
import { DatabaseManager } from '../src/DatabaseManager';

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls, etc.
        await Font.loadAsync({
          'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
          'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
          'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
        });
        
        // Initialize the database
        await DatabaseManager.getInstance().initialize();
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <RootSiblingParent>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: COLORS.background,
              },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="(tabs)"
              options={{
                // Disable the header to prevent double headers when using Tabs
                headerShown: false,
              }}
            />
            <Stack.Screen name="devices/add" />
            <Stack.Screen name="devices/create" />
            <Stack.Screen name="devices/[id]" />
            <Stack.Screen name="devices/[id]/edit" />
            <Stack.Screen name="devices/[id]/pair" />
            <Stack.Screen name="devices/ble-test" />
            <Stack.Screen name="devices/test-data" options={{ title: "Test Data" }} />
            <Stack.Screen name="screens/logs" options={{ title: "Data Logs" }} />
          </Stack>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>
  );
};

export default RootLayout; 