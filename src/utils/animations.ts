import { useCallback } from 'react';
import { Platform } from 'react-native';
import {
  FadeIn,
  FadeInDown,
  FadeInUp,
  withSpring,
  withTiming,
  WithTimingConfig,
  Easing,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

// Optimized spring configuration
export const SPRING_CONFIG = {
  damping: 10,
  mass: 0.3,
  stiffness: 100,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
} as const;

// Optimized timing configuration
export const TIMING_CONFIG: WithTimingConfig = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
} as const;

// Shared animation factory
export const createSharedAnimation = (delay: number = 0) => {
  return Platform.select({
    ios: FadeInDown.duration(300)
      .springify()
      .delay(delay)
      .damping(SPRING_CONFIG.damping)
      .mass(SPRING_CONFIG.mass),
    android: FadeIn.duration(250)
      .delay(delay)
  });
};

// Optimized press animation hook
export const useAnimatedPress = (scale: number = 0.98) => {
  const pressed = useSharedValue(false);
  
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{
        scale: withSpring(
          pressed.value ? scale : 1, 
          SPRING_CONFIG
        )
      }]
    };
  });

  return {
    animatedStyle,
    pressHandlers: {
      onPressIn: useCallback(() => {
        pressed.value = true;
      }, []),
      onPressOut: useCallback(() => {
        pressed.value = false;
      }, [])
    }
  };
};

// Gradient optimization utilities
export const GRADIENT_PROPS = Platform.select({
  ios: {
    shouldRasterizeIOS: true,
  },
  android: {
    renderToHardwareTextureAndroid: true,
  },
});

// Chart animation configuration
export const CHART_ANIMATION_CONFIG = {
  animationEnabled: true,
  animationDuration: 300,
  animationEasing: Easing.ease,
  propsForLabels: {
    fontSize: 10,
    fontWeight: '400'
  }
} as const;

// Optimized layout animation configuration
export const LAYOUT_ANIMATION_CONFIG = {
  damping: 10,
  mass: 0.3,
  stiffness: 100
} as const; 