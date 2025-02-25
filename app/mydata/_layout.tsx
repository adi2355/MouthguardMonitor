import { Stack } from 'expo-router';

export default function MyDataLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="daily-average" 
        options={{ 
          title: "Daily Average",
          headerTintColor: "#00E676",
          headerStyle: { backgroundColor: "#000000" },
        }} 
      />
      <Stack.Screen 
        name="weekly-average" 
        options={{ 
          title: "Weekly Average",
          headerTintColor: "#00E676",
          headerStyle: { backgroundColor: "#000000" },
        }} 
      />
      <Stack.Screen 
        name="weekly-overview" 
        options={{ 
          title: "Weekly Overview",
          headerTintColor: "#00E676",
          headerStyle: { backgroundColor: "#000000" },
        }} 
      />
      <Stack.Screen 
        name="monthly-overview" 
        options={{ 
          title: "Monthly Overview",
          headerTintColor: "#00E676",
          headerStyle: { backgroundColor: "#000000" },
        }} 
      />
    </Stack>
  );
}