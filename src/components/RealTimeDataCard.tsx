/**
 * @fileoverview Real-Time Data Card Component
 * 
 * A reusable component that displays real-time BLE data with visual indicators,
 * animations, and proper formatting. Shows live data status and provides
 * smooth transitions when data updates.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

/**
 * Props for the RealTimeDataCard component
 */
interface RealTimeDataCardProps {
  /** The label/title for the data */
  label: string;
  /** The current value to display */
  value: number;
  /** The unit of measurement */
  unit: string;
  /** Whether the device is connected and data is live */
  isLive: boolean;
  /** Number of decimal places to show */
  decimalPlaces?: number;
  /** Icon component to display (optional) */
  icon?: React.ReactNode;
  /** Background color for the card */
  backgroundColor?: string;
  /** Text color for the value */
  valueColor?: string;
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * RealTimeDataCard Component
 * 
 * Displays real-time data from BLE devices with visual indicators for live status,
 * smooth animations on data updates, and consistent formatting.
 * 
 * @param props - Component properties
 * 
 * @example
 * ```tsx
 * <RealTimeDataCard
 *   label="Speed"
 *   value={currentSpeed}
 *   unit="km/h"
 *   isLive={isConnected}
 *   decimalPlaces={1}
 * />
 * ```
 */
const RealTimeDataCard: React.FC<RealTimeDataCardProps> = ({
  label,
  value,
  unit,
  isLive,
  decimalPlaces = 1,
  icon,
  backgroundColor = '#FFFFFF',
  valueColor = '#333333',
}) => {
  // ============================================================================
  // ANIMATION SETUP
  // ============================================================================

  /** Animation value for the live indicator pulse */
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  /** Animation value for data update flash */
  const flashAnimation = useRef(new Animated.Value(0)).current;
  
  /** Previous value reference for detecting changes */
  const previousValue = useRef(value);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Effect to handle live indicator pulse animation
   * Creates a continuous pulsing effect when data is live
   */
  useEffect(() => {
    if (isLive) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 0.6,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      
      return () => pulseLoop.stop();
    }
  }, [isLive, pulseAnimation]);

  /**
   * Effect to handle data update flash animation
   * Flashes the card briefly when new data is received
   */
  useEffect(() => {
    if (value !== previousValue.current && isLive) {
      previousValue.current = value;
      
      // Flash animation on data update
      Animated.sequence([
        Animated.timing(flashAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [value, isLive, flashAnimation]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Formats the value with appropriate decimal places
   * 
   * @param val - The value to format
   * @returns Formatted string representation of the value
   */
  const formatValue = (val: number): string => {
    if (isLive) {
      return val.toFixed(decimalPlaces);
    }
    return '0'.padEnd(decimalPlaces + 2, '.0');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Animated.View 
      style={[
        styles.container,
        { backgroundColor },
        {
          // Flash overlay when data updates
          shadowOpacity: flashAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 0.3],
          }),
        }
      ]}
    >
      {/* Live Status Indicator */}
      {isLive && (
        <View style={styles.liveIndicator}>
          <Animated.View
            style={[
              styles.liveIndicatorDot,
              {
                opacity: pulseAnimation,
                transform: [
                  {
                    scale: pulseAnimation.interpolate({
                      inputRange: [0.6, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text style={styles.liveIndicatorText}>LIVE</Text>
        </View>
      )}

      {/* Card Content */}
      <View style={styles.content}>
        {/* Icon Section */}
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}

        {/* Data Section */}
        <View style={styles.dataSection}>
          <Text style={styles.label}>{label}</Text>
          <Animated.Text
            style={[
              styles.value,
              { color: valueColor },
              {
                // Subtle scale animation on data update
                transform: [
                  {
                    scale: flashAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    }),
                  },
                ],
              },
            ]}
          >
            {formatValue(value)}
          </Animated.Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>

      {/* Update Flash Overlay */}
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.2],
            }),
          },
        ]}
        pointerEvents="none"
      />
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  /**
   * Main container for the data card
   */
  container: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    margin: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },

  /**
   * Live status indicator container
   */
  liveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#20A446',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },

  /**
   * Live indicator pulsing dot
   */
  liveIndicatorDot: {
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginRight: 3,
  },

  /**
   * Live indicator text
   */
  liveIndicatorText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },

  /**
   * Main content container
   */
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  /**
   * Icon container
   */
  iconContainer: {
    marginRight: 12,
  },

  /**
   * Data section container
   */
  dataSection: {
    flex: 1,
    alignItems: 'flex-start',
  },

  /**
   * Data label text
   */
  label: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },

  /**
   * Data value text
   */
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  /**
   * Data unit text
   */
  unit: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },

  /**
   * Flash overlay for data updates
   */
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#20A446',
    borderRadius: 12,
  },
});

export default RealTimeDataCard;
