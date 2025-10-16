/**
 * TypeScript declarations for Native Bike Animation Component
 */

import { ViewStyle } from 'react-native';

export interface NativeBikeAnimationProps {
  /** Current cycling speed in km/h - affects animation frame rate */
  speed: number;
  /** Bluetooth connection status - affects animation state */
  isConnected: boolean;
  /** Gender selection for animation sequence - 'male' or 'female' */
  gender: 'male' | 'female';
  /** Optional callback for Bluetooth icon press */
  onBluetoothPress?: () => void;
  /** Component style */
  style?: ViewStyle;
}

declare const NativeBikeAnimationView: React.ComponentType<NativeBikeAnimationProps>;
export default NativeBikeAnimationView;
