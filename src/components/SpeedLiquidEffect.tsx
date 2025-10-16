/**
 * @fileoverview Speed Liquid Effect Component
 * 
 * This component creates dynamic liquid glass effects that respond to speed changes.
 * It provides flowing animations and liquid morphing effects for enhanced visual appeal.
 * 
 * Features:
 * - Speed-responsive liquid movement
 * - Dynamic opacity and blur effects
 * - Smooth transitions and morphing
 * - Performance-optimized animations
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SpeedLiquidEffectProps {
  /** Current speed value that affects liquid movement */
  speed: number;
  /** Maximum speed for normalization */
  maxSpeed?: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Component width */
  width?: number | string;
  /** Component height */
  height?: number | string;
}

const SpeedLiquidEffect: React.FC<SpeedLiquidEffectProps> = ({
  speed,
  maxSpeed = 50,
  duration = 1000,
  width = '100%',
  height = '100%',
}) => {
  // Animated values for liquid effects
  const liquidFlow = useRef(new Animated.Value(0)).current;
  const liquidOpacity = useRef(new Animated.Value(0.3)).current;
  const liquidScale = useRef(new Animated.Value(1)).current;

  // Calculate normalized speed (0-1)
  const normalizedSpeed = Math.min(speed / maxSpeed, 1);

  useEffect(() => {
    // Animate liquid flow based on speed
    const flowAnimation = Animated.timing(liquidFlow, {
      toValue: normalizedSpeed * 100,
      duration,
      useNativeDriver: true,
    });

    // Animate opacity based on speed
    const opacityAnimation = Animated.timing(liquidOpacity, {
      toValue: 0.3 + (normalizedSpeed * 0.4), // 0.3 to 0.7
      duration,
      useNativeDriver: true,
    });

    // Animate scale based on speed
    const scaleAnimation = Animated.spring(liquidScale, {
      toValue: 1 + (normalizedSpeed * 0.1), // 1.0 to 1.1
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    });

    // Run all animations in parallel
    Animated.parallel([flowAnimation, opacityAnimation, scaleAnimation]).start();
  }, [speed, normalizedSpeed, liquidFlow, liquidOpacity, liquidScale, duration]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Animated.View
        style={[
          styles.liquidContainer,
          {
            opacity: liquidOpacity,
            transform: [
              {
                translateX: liquidFlow.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 50],
                }),
              },
              { scale: liquidScale },
            ],
          },
        ]}
      >
        <View style={styles.liquidGradient} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  liquidContainer: {
    width: '100%',
    height: '100%',
  },
  liquidGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default SpeedLiquidEffect;
