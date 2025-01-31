import { Stack } from "expo-router";
import { useState } from "react";
import { BluetoothContext, BluetoothHandler } from "@/src/contexts/BluetoothContext";

export default function RootLayout() {

  const [bluetoothHandler] = useState<BluetoothHandler>(new BluetoothHandler());

  return (
    <BluetoothContext.Provider value={bluetoothHandler}>
      <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
      </Stack>  
    </BluetoothContext.Provider>
  );
}
