/**
 * @fileoverview Bike Animation Component for FunFeet Cycling App
 * 
 * This component renders a cycling animation based on speed and gender.
 * It displays a sequence of PNG images to create a smooth cycling animation
 * that responds to real-time speed data from BLE devices.
 * 
 * Features:
 * - Dynamic frame-based animation using requestAnimationFrame
 * - Gender-specific animation sequences (male/female cyclists)
 * - Speed-responsive animation timing
 * - Bluetooth connection indicator
 * - Full-screen animation with customizable height
 * - Liquid glass overlay cards in landscape mode using BlurView
 * - Enhanced glassmorphism with dynamic liquid effects
 * - Smooth screen rotation animationsz
 * 
 * @author FunFeet Development Team
 * @version 2.0.0
 * @since 2024
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NativeBikeAnimation from './NativeBikeAnimation';
import { useBLE } from '../contexts/BLEContext';
import { useAuth } from '../contexts/AuthContext';
import LandscapeMetricsOverlay from './LandscapeMetricsOverlay';
import InlineStats from './InlineStats';
import HighscoreCard from '../components/HighscoreCard';
import { LeaderboardService } from '../services/LeaderboardService';
// removed useWindowDimensions

// Get screen dimensions for responsive layout
// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

/**
 * Props for the BikeAnimation component
 */
interface BikeAnimationProps {
  /** Current cycling speed in km/h - affects animation frame rate */
  speed: number;
  /** Bluetooth connection status - affects UI elements visibility */
  isConnected: boolean;
  /** Gender selection for animation sequence - 'male' or 'female' */
  gender: 'male' | 'female';
  /** Optional callback for Bluetooth icon press */
  onBluetoothPress?: () => void;
  /** Optional callback for menu icon press */
  onMenuPress?: () => void;
  /** Session goal distance in km for progress bar */
  sessionGoalKm?: number;
  /** Animation resize mode - 'stretch' | 'contain' | 'cover' */
  resizeMode?: 'stretch' | 'contain' | 'cover';
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * BikeAnimation Component
 * 
 * Renders a cycling animation that responds to real-time speed data.
 * The animation uses a sequence of PNG images to create a smooth cycling effect.
 * Enhanced with liquid glass effects and dynamic glassmorphism.
 * 
 * @param props - Component properties
 * @param props.speed - Current cycling speed (affects animation speed)
 * @param props.isConnected - Bluetooth connection status
 * @param props.gender - Gender for animation sequence selection
 * @param props.onBluetoothPress - Callback for Bluetooth icon press
 * 
 * @example
 * ```tsx
 * <BikeAnimation
 *   speed={25.5}
 *   isConnected={true}
 *   gender="male"
 *   onBluetoothPress={() => navigation.navigate('BLE')}
 * />
 * ```
 */
const BikeAnimation: React.FC<BikeAnimationProps> = ({ 
  speed, 
  isConnected, 
  gender = 'male',
  onBluetoothPress,
  onMenuPress,
  sessionGoalKm = 2
}) => {
  console.log("🎬 BikeAnimation received props:", { speed, isConnected, gender });
  console.log("🧑‍🦱 BikeAnimation: Avatar gender received for animation:", gender);
  
  // Get BLE data for overlay display
  const { currentDistance, currentCycles, currentSpeed, currentCalories, resetTrigger } = useBLE();
  
  // Get user profile for daily goal
  const { userProfile } = useAuth();
  
  // Safe area insets to avoid system UI
  const insets = useSafeAreaInsets();
  
  // Screen dimensions for landscape detection
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const isLandscape = screenDimensions.width > screenDimensions.height;
  const isSmallScreen = screenDimensions.width < 600 || screenDimensions.height < 400;
  
  // Calculate responsive container dimensions - maximize height in landscape, avoid navigation bars
  const containerHeight = isLandscape 
    ? screenDimensions.height - insets.top - insets.bottom // Full height minus safe areas in landscape
    : 300; // Fixed height for portrait mode
  
  // Responsive positioning and sizing
  const topIconsTop = isSmallScreen ? 20 : 32;
  const topIconsRight = isSmallScreen ? 16 : 32;
  const iconSize = isSmallScreen ? 36 : 44;

  // ============================================================================
  // ANIMATED VALUES FOR LIQUID GLASS EFFECTS
  // ============================================================================

  /** Animated value for liquid glass opacity */
  const liquidGlassOpacity = useRef(new Animated.Value(0)).current;
  
  /** Animated value for speed-based liquid movement */
  const liquidMovement = useRef(new Animated.Value(0)).current;
  
  /** Animated value for glass card scaling */
  const glassCardScale = useRef(new Animated.Value(1)).current;
  
  // rotationTransition removed (unused)

  // Simple session timer (HH:MM:SS) shown under the Bluetooth icon
  const [elapsedMs, setElapsedMs] = useState(0);
  const [_highscoreData, setHighscoreData] = useState({
    distanceKm: 0,
    caloriesKcal: 0,
    badges: 0
  });
  // Time formatting moved into InlineStats
  

  // ============================================================================
  // HIGHSCORE DATA FETCHING
  // ============================================================================
  
  /**
   * Fetch highscore data from sessions table
   */
  const fetchHighscoreData = async () => {
    try {
      console.log('[HIGHSCORE] 🏆 Fetching highscore data...');
      
      // Get top users by distance to find the highest distance
      const topUsers = await LeaderboardService.getTopUsers('distance', 1);
      
      if (topUsers.length > 0) {
        const topUser = topUsers[0];
        setHighscoreData({
          distanceKm: topUser.total_distance,
          caloriesKcal: topUser.total_calories,
          badges: topUser.total_sessions, // Using session count as badge count for now
        });
        console.log('[HIGHSCORE] ✅ Highscore data loaded:', {
          distance: topUser.total_distance,
          calories: topUser.total_calories,
          sessions: topUser.total_sessions,
        });
      } else {
        console.log('[HIGHSCORE] ℹ️ No highscore data found');
      }
    } catch (error) {
      console.error('[HIGHSCORE] ❌ Failed to fetch highscore data:', error);
    }
  };

  // ============================================================================
  // NOTE: Image assets are handled by the native Android component
  // PNG sequences are loaded directly from android/app/src/main/assets/images/
  // ============================================================================

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Selects the appropriate frame sequence based on gender
   * Returns either male or female animation frames
   * Note: This is handled by the native Android component
   */
  // const _frameImages = useMemo(() => {
  //   return gender === 'female' ? femaleFrameImages : maleFrameImages;
  // }, [gender, femaleFrameImages, maleFrameImages]);


  // removed unused width from useWindowDimensions


  // Rotation transition removed - BikeAnimation is now simple

  // ============================================================================
  // SIMPLE EFFECTS
  // ============================================================================

  /**
   * Screen orientation handler
   */
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Drive timer based on connection state - only counts when speed > 0.00
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isConnected) {
      interval = setInterval(() => {
        // Only increment timer if speed is greater than 0.00
        if (currentSpeed > 0.00) {
          setElapsedMs((prev) => prev + 1000);
          console.log('⏱️ BikeAnimation Timer counting - Speed:', currentSpeed, 'km/h');
        } else {
          console.log('⏸️ BikeAnimation Timer paused - Speed:', currentSpeed, 'km/h');
        }
      }, 1000);
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, currentSpeed]);

  /**
   * Effect to reset timer when session is reset
   */
  useEffect(() => {
    if (resetTrigger > 0) {
      setElapsedMs(0);
      console.log('⏱️ BikeAnimation Timer reset due to session reset');
    }
  }, [resetTrigger]);

  // Fetch highscore data on component mount
  useEffect(() => {
    fetchHighscoreData();
  }, []);

  /**
   * Liquid glass effects when speed prop changes
   */
  useEffect(() => {
    const speedFactor = speed / 10;
    const movementRange = speedFactor * 50;
    
    Animated.parallel([
      Animated.timing(liquidMovement, {
        toValue: movementRange,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(liquidGlassOpacity, {
        toValue: 0.8 + (speedFactor * 0.2),
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(glassCardScale, {
        toValue: 1 + (speedFactor * 0.05),
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [speed, liquidMovement, liquidGlassOpacity, glassCardScale]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      <NativeBikeAnimation
        speed={speed}
        isConnected={isConnected}
        gender={gender}
        rpm={0}
        distance={0}
        calories={0}
        resizeMode={isLandscape ? 'cover' : 'cover'}
        style={styles.nativeAnimation}
      />

      {/* Top-right icons row: Bluetooth + dots (dots on the right) */}
      <View 
        style={[
          styles.topIconsRow,
          {
            top: topIconsTop,
            right: topIconsRight,
          }
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity 
          style={[styles.bluetoothIcon, { width: iconSize, height: iconSize }]} 
          onPress={onBluetoothPress}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/icons/bluetooth.png')}
            style={[
              styles.bluetoothIconImage,
              { width: iconSize * 0.5, height: iconSize * 0.5 }
            ]}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuIcon, { width: iconSize, height: iconSize }]} 
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/icons/dots.png')}
            style={[
              styles.dotsIconImage,
              { width: iconSize * 0.3, height: iconSize * 0.3 }
            ]}
          />
        </TouchableOpacity>
      </View>

      {/* Inline stats (no card) under the Bluetooth icon - landscape only */}
      {isLandscape && (
        <View style={styles.inlineStatsRow}>
          <InlineStats elapsedMs={elapsedMs} cycles={currentCycles ?? 0} caloriesKcal={currentCalories} />
        </View>
      )}

      {/* Landscape Metrics Overlay */}
      {isLandscape && (
        <LandscapeMetricsOverlay
          distance={currentDistance ?? 0}
          speed={speed}
          isConnected={isConnected}
          sessionGoalKm={sessionGoalKm}
          dailyGoalKm={userProfile?.daily_goal_calories ? userProfile.daily_goal_calories / 40 : 5}
        />
      )}

      {/* Highscore card - landscape mode only (portrait mode has it in HomeScreen) */}
      {isLandscape && (
        <HighscoreCard />
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  /**
   * Main container for the bike animation
   * Responsive height based on orientation
   */
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF', // White background
    position: 'relative', // For absolute positioning of Bluetooth icon
    paddingTop: 20, // Add top padding to prevent animation from being covered
  },
  
  /**
   * The main animation image
   * Covers the full container with stretch resize mode
   */
  animationImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'stretch', // Stretches to fill container
  },

  /**
   * Native animation view
   * Covers the full container for native rendering
   */
  nativeAnimation: {
    width: '100%',
    height: '100%',
  },
  
  /**
   * Bluetooth icon container
   * Positioned in top-right corner of animation
   */
  topIconsRow: {
    position: 'absolute',
    top: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999, // Very high z-index to ensure buttons are above everything
    elevation: 10, // Android elevation to ensure buttons are above everything
  },

  bluetoothIcon: {
    width: 44, // Larger touch target
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000, // Very high z-index to ensure it's above everything
  },

  /**
   * Menu icon container
   */
  menuIcon: {
    width: 44, // Larger touch target
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    zIndex: 10000, // Very high z-index to ensure it's above everything
  },
  
  /**
   * Bluetooth icon image
   * White icon on green background
   */
  bluetoothIconImage: {
    width: 24,
    height: 24,
    tintColor: '#000000',
  },

  /**
   * Inline stats row (top-right, under Bluetooth)
   */
  inlineStatsRow: {
    position: 'absolute',
    top: 66, // slightly closer under icons
    right: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },


  /**
   * Dots icon image placed left of Bluetooth
   */
  dotsIconImage: {
    marginLeft: 8,
    width: 12,
    height: 12,
    tintColor: '#000000',
    resizeMode: 'contain',
  },

  /**
   * Landscape metrics overlay (top right)
   */
  landscapeMetrics: {
    position: 'absolute',
    top: 20,
    right: 80, // Space for bluetooth button
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  /**
   * Metric card for landscape
   */
  metricCard: {
    alignItems: 'center',
    marginBottom: 8,
  },

  /**
   * Metric value text
   */
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  /**
   * Metric unit text
   */
  metricUnit: {
    fontSize: 12,
    color: '#20A446',
    fontWeight: '600',
    marginTop: 2,
  },

  /**
   * Metric label text
   */
  metricLabel: {
    fontSize: 10,
    color: '#CCCCCC',
    fontWeight: '600',
    marginTop: 1,
  },

  // ============================================================================
  // CLEAN METRICS OVERLAY STYLES
  // ============================================================================

  /**
   * Main metrics overlay container
   */
  metricsOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    justifyContent: 'space-between',
    pointerEvents: 'box-none', // Allow touches to pass through to animation
  },

  /**
   * Connection status indicator
   */
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },

  /**
   * Status dot indicator
   */
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  /**
   * Connection status text
   */
  connectionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  /**
   * Metric card base style
   */
  metricCardBase: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  /**
   * Primary metric card (Speed)
   */
  primaryCard: {
    alignSelf: 'center',
    minWidth: 120,
    marginBottom: 20,
  },

  /**
   * Primary metric value (large)
   */
  primaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  /**
   * Primary metric unit
   */
  primaryUnit: {
    fontSize: 16,
    color: '#20A446',
    fontWeight: '600',
    marginTop: 4,
  },

  /**
   * Primary metric label
   */
  primaryLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 1,
  },

  /**
   * Secondary metrics row
   */
  secondaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },

  /**
   * Secondary metric card
   */
  secondaryCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  /**
   * Secondary metric value
   */
  secondaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  /**
   * Secondary metric unit
   */
  secondaryUnit: {
    fontSize: 12,
    color: '#20A446',
    fontWeight: '600',
    marginTop: 2,
  },

  /**
   * Secondary metric label
   */
  secondaryLabel: {
    fontSize: 10,
    color: '#CCCCCC',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  /**
   * Connected status dot (green)
   */
  connectedDot: {
    backgroundColor: '#4CAF50',
  },

  /**
   * Disconnected status dot (red)
   */
  disconnectedDot: {
    backgroundColor: '#FF5722',
  },
});

export default BikeAnimation;
