import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from '../../../src/constants';
import Animated, { 
  withRepeat, 
  withTiming,
  useAnimatedStyle, 
  useSharedValue,
  FadeIn
} from 'react-native-reanimated';
import { TIMING_CONFIG } from '@/src/utils/animations';

export default function LoadingView() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        ...TIMING_CONFIG,
        duration: 1500 // Slightly slower for smoother rotation
      }),
      -1
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={styles.content}
      >
        <Animated.View style={spinStyle}>
          <MaterialCommunityIcons 
            name="cannabis" 
            size={32} 
            color={COLORS.primary} 
          />
        </Animated.View>
        <Text style={styles.text}>Loading...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
});