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
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

// Get screen dimensions for responsive layout
const { height } = Dimensions.get('window');

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
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * BikeAnimation Component
 * 
 * Renders a cycling animation that responds to real-time speed data.
 * The animation uses a sequence of PNG images to create a smooth cycling effect.
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
  isConnected: _isConnected, 
  gender = 'male',
  onBluetoothPress
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /** Current frame index in the animation sequence */
  const [currentEnvFrame, setCurrentEnvFrame] = useState(0);
  
  /** Animation frame rate - affects smoothness of animation */
  const [_fps, setFps] = useState(60);
  
  /** Reference to the current animation frame for cleanup */
  const animFrameRef = useRef<number | null>(null);
  
  /** Timestamp of the last frame for frame rate calculation */
  const lastTimeRef = useRef<number>(0);

  // ============================================================================
  // IMAGE ASSETS - MALE SEQUENCE
  // ============================================================================

  /**
   * Array of male cycling animation frames
   * Each frame is a PNG image showing a different phase of the cycling motion
   * Total of 113 frames for smooth animation
   */
  const maleFrameImages = useMemo(() => [
    require('../../assets/images/CombinedMale/NewLevelSequence.0001000.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001001.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001002.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001003.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001004.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001005.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001006.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001007.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001008.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001009.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001010.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001011.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001012.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001013.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001014.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001015.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001016.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001017.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001018.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001019.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001020.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001021.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001022.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001023.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001024.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001025.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001026.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001027.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001028.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001029.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001030.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001031.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001032.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001033.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001034.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001035.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001036.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001037.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001038.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001039.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001040.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001041.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001042.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001043.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001044.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001045.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001046.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001047.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001048.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001049.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001050.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001051.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001052.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001053.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001054.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001055.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001056.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001057.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001058.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001059.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001060.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001061.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001062.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001063.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001064.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001065.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001066.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001067.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001068.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001069.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001070.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001071.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001072.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001073.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001074.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001075.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001076.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001077.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001078.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001079.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001080.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001081.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001082.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001083.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001084.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001085.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001086.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001087.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001088.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001089.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001090.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001091.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001092.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001093.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001094.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001095.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001096.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001097.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001098.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001099.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001100.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001101.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001102.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001103.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001104.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001105.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001106.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001107.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001108.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001109.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001110.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001111.png'),
    require('../../assets/images/CombinedMale/NewLevelSequence.0001112.png'),
  ], []);

  // ============================================================================
  // IMAGE ASSETS - FEMALE SEQUENCE
  // ============================================================================

  /**
   * Array of female cycling animation frames
   * Each frame is a PNG image showing a different phase of the cycling motion
   * Total of 113 frames for smooth animation
   */
  const femaleFrameImages = useMemo(() => [
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001000.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001001.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001002.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001003.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001004.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001005.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001006.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001007.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001008.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001009.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001010.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001011.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001012.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001013.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001014.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001015.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001016.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001017.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001018.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001019.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001020.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001021.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001022.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001023.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001024.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001025.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001026.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001027.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001028.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001029.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001030.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001031.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001032.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001033.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001034.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001035.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001036.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001037.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001038.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001039.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001040.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001041.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001042.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001043.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001044.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001045.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001046.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001047.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001048.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001049.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001050.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001051.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001052.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001053.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001054.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001055.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001056.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001057.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001058.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001059.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001060.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001061.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001062.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001063.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001064.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001065.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001066.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001067.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001068.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001069.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001070.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001071.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001072.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001073.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001074.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001075.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001076.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001077.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001078.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001079.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001080.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001081.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001082.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001083.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001084.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001085.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001086.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001087.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001088.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001089.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001090.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001091.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001092.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001093.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001094.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001095.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001096.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001097.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001098.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001099.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001100.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001101.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001102.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001103.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001104.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001105.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001106.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001107.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001108.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001109.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001110.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001111.png'),
    require('../../assets/images/CombinedFemale/NewLevelSequence.0001112.png'),
  ], []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Selects the appropriate frame sequence based on gender
   * Returns either male or female animation frames
   */
  const frameImages = useMemo(() => {
    return gender === 'female' ? femaleFrameImages : maleFrameImages;
  }, [gender, femaleFrameImages, maleFrameImages]);

  /**
   * Gets the current animation frame image
   * Uses modulo to loop through the frame sequence
   */
  const currentFrameImage = useMemo(() => {
    return frameImages[currentEnvFrame % frameImages.length];
  }, [currentEnvFrame, frameImages]);

  // ============================================================================
  // ANIMATION LOGIC
  // ============================================================================

  /**
   * Calculates the target frame rate based on current speed
   * Higher speeds result in faster animation
   * 
   * @param currentSpeed - Current cycling speed in km/h
   * @returns Target frame rate for animation
   */
  const calculateTargetFPS = useCallback((currentSpeed: number): number => {
    // Base frame rate when speed is 0
    const baseFPS = 30;
    
    // Maximum frame rate at high speeds
    const maxFPS = 60;
    
    // Speed threshold for maximum frame rate
    const maxSpeedThreshold = 30;
    
    if (currentSpeed <= 0) {
      return baseFPS;
    }
    
    // Linear interpolation between base and max FPS
    const fpsRatio = Math.min(currentSpeed / maxSpeedThreshold, 1);
    return Math.round(baseFPS + (maxFPS - baseFPS) * fpsRatio);
  }, []);

  /**
   * Main animation loop using requestAnimationFrame
   * Updates the current frame based on speed and time
   */
  const animate = useCallback(() => {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTimeRef.current;
    
    // Calculate target FPS based on current speed
    const targetFPS = calculateTargetFPS(speed);
    const frameInterval = 1000 / targetFPS;
    
    // Update frame if enough time has passed
    if (deltaTime >= frameInterval) {
      setCurrentEnvFrame(prev => prev + 1);
      lastTimeRef.current = currentTime;
    }
    
    // Continue animation loop
    animFrameRef.current = requestAnimationFrame(animate);
  }, [speed, calculateTargetFPS]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Starts and stops the animation loop
   * Animation runs continuously while component is mounted
   */
  useEffect(() => {
    // Start animation loop
    animFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup function to stop animation
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [animate]);

  /**
   * Updates frame rate when speed changes
   * Ensures smooth animation transitions
   */
  useEffect(() => {
    const newFPS = calculateTargetFPS(speed);
    setFps(newFPS);
  }, [speed, calculateTargetFPS]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      {/* Main animation image */}
      <Image
        source={currentFrameImage}
        style={styles.animationImage}
        resizeMode="stretch"
      />
      
      {/* Bluetooth connection indicator */}
      <TouchableOpacity 
        style={styles.bluetoothIcon} 
        onPress={onBluetoothPress}
        activeOpacity={0.7}
      >
        <Image
          source={require('../../assets/icons/bluetooth.png')}
          style={styles.bluetoothIconImage}
        />
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  /**
   * Main container for the bike animation
   * Takes 40% of screen height and full width
   */
  container: {
    width: '100%',
    height: height * 0.4, // 40% of screen height
    backgroundColor: '#FFFFFF', // White background
    position: 'relative', // For absolute positioning of Bluetooth icon
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
   * Bluetooth icon container
   * Positioned in top-right corner of animation
   */
  bluetoothIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: '#20A446', // Green background
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  /**
   * Bluetooth icon image
   * White icon on green background
   */
  bluetoothIconImage: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF', // White tint
  },
});

export default BikeAnimation;
