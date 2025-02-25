import { Stack } from 'expo-router';

export default function StrainsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="popular" 
        options={{ 
          title: "Popular Strains",
          headerTintColor: "#00E676",
          headerStyle: { backgroundColor: "#000000" },
        }} 
      />
      <Stack.Screen 
        name="details" 
        options={{ 
          title: "Strain Details",
          headerTintColor: "#00E676",
          headerStyle: { backgroundColor: "#000000" },
        }} 
      />
      <Stack.Screen 
        name="compare" 
        options={{ 
          title: "Compare Strains",
          headerTintColor: "#00E676",
          headerStyle: { backgroundColor: "#000000" },
        }} 
      />
    </Stack>
  );
}