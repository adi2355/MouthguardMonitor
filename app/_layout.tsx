import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { BluetoothContext, BluetoothHandler } from "@/src/contexts/BluetoothContext";
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [bluetoothHandler] = useState<BluetoothHandler>(new BluetoothHandler());

  return (
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
        <Stack.Screen name="+not-found" />
      </Stack>  
    </BluetoothContext.Provider>
  );
}
