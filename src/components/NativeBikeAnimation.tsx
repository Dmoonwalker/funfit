/**
 * @fileoverview Native Bike Animation Component
 * 
 * This component uses a native Android view for high-performance bike animation rendering.
 * The native component handles PNG sequence animation based on speed data from React Native.
 * 
 * Features:
 * - Native Android rendering for optimal performance
 * - Speed-responsive animation timing
 * - Gender-specific animation sequences
 * - React Native bridge communication
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import { requireNativeComponent, ViewStyle } from 'react-native';

// Define the native component interface
interface NativeBikeAnimationProps {
  /** Current cycling speed in km/h - affects animation frame rate */
  speed: number;
  /** Bluetooth connection status - affects animation state */
  isConnected: boolean;
  /** Gender selection for animation sequence - 'male' or 'female' */
  gender: 'male' | 'female';
  /** Cadence in RPM */
  rpm?: number;
  /** Total distance in km */
  distance?: number;
  /** Calories burned */
  calories?: number;
  /** Resize mode for native view */
  resizeMode?: 'stretch' | 'contain' | 'cover';
  /** Component style */
  style?: ViewStyle;
}

// Get the native component
const NativeBikeAnimationView = requireNativeComponent<NativeBikeAnimationProps>('BikeAnimationView');

/**
 * NativeBikeAnimation Component
 * 
 * Renders a native Android bike animation that responds to real-time speed data.
 * The animation uses a sequence of PNG images rendered natively for optimal performance.
 * 
 * @param props - Component properties
 * @param props.speed - Current cycling speed (affects animation speed)
 * @param props.isConnected - Bluetooth connection status
 * @param props.gender - Gender for animation sequence selection
 * @param props.style - Component styling
 * 
 * @example
 * ```tsx
 * <NativeBikeAnimation
 *   speed={25.5}
 *   isConnected={true}
 *   gender="male"
 *   style={{ width: '100%', height: 300 }}
 * />
 * ```
 */
const NativeBikeAnimation: React.FC<NativeBikeAnimationProps> = ({
  speed,
  isConnected,
  gender = 'male',
  rpm = 0,
  distance = 0,
  calories = 0,
  resizeMode = 'stretch',
  style,
}) => {
  return (
    <NativeBikeAnimationView
      speed={speed}
      isConnected={isConnected}
      gender={gender}
      rpm={rpm}
      distance={distance}
      calories={calories}
      resizeMode={resizeMode}
      style={style}
    />
  );
};

export default NativeBikeAnimation;
