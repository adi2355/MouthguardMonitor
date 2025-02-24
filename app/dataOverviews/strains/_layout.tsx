import { Stack } from 'expo-router';
import { COLORS } from '@/src/constants';

export default function StrainsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackVisible: true,
      }}
    />
  );
} 