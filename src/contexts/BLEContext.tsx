/**
 * @fileoverview BLE Context for FunFeet Cycling App
 * 
 * This context provides a centralized state management system for Bluetooth Low Energy (BLE) operations.
 * It wraps the BLEService and provides a React-friendly interface for components to access
 * BLE functionality and real-time data.
 * 
 * Features:
 * - Device scanning and discovery
 * - Connection management
 * - Real-time cycling data (speed, distance, calories)
 * - Permission management
 * - State synchronization across components
 * - Error handling and user notifications
 * 
 * The context uses React's Context API to provide BLE functionality
 * to any component in the component tree.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import BLEService, { BLEDevice, CharacteristicValue, CyclingData } from '../services/BLEService';
import { CyclingSession, ActiveSession, SessionUtils } from '../types/Session';
import { UltraSimpleSync } from '../services/UltraSimpleSync';
import { supabase } from '../config/supabase';

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

/**
 * Type definition for the BLE Context
 * Defines all the properties and methods available through the context
 */
interface BLEContextType {
  /** Whether a device is currently connected */
  isConnected: boolean;
  /** Currently connected device information */
  connectedDevice: BLEDevice | null;
  /** Whether device scanning is currently active */
  isScanning: boolean;
  /** List of discovered BLE devices */
  devices: BLEDevice[];
  /** Whether Bluetooth permissions have been granted */
  hasPermissions: boolean;
  /** Current characteristic values from connected device */
  characteristicValues: CharacteristicValue[];
  /** Current cycling speed in km/h */
  currentSpeed: number;
  /** Current distance traveled in km */
  currentDistance: number;
  /** Current cycles completed */
  currentCycles: number;
  /** Current calories burned */
  currentCalories: number;
  /** Current cadence (rpm) */
  currentRpm: number;
  /** Current active session */
  currentSession: ActiveSession | null;
  /** Whether a session is currently active */
  isSessionActive: boolean;
  /** List of completed sessions */
  completedSessions: CyclingSession[];
  
  // Methods
  /** Starts scanning for BLE devices */
  startScan: () => Promise<void>;
  /** Tries direct connection to target device (Android API 31+) */
  tryDirectConnection: () => Promise<boolean>;
  /** Stops the current device scan */
  stopScan: () => void;
  /** Connects to a specific BLE device */
  connectToDevice: (deviceId: string) => Promise<void>;
  /** Disconnects from the currently connected device */
  disconnectDevice: () => Promise<void>;
  /** Requests Bluetooth permissions from the user */
  requestPermissions: () => Promise<boolean>;
  /** Fetch completed sessions from cloud */
  fetchCompletedSessions: (userId?: string) => Promise<void>;
  /** Start a new cycling session */
  startSession: (userId: string) => Promise<boolean>;
  /** Stop the current cycling session */
  stopSession: () => Promise<boolean>;
  /** Cleanup function for logout - disconnects BLE and saves session */
  cleanupForLogout: () => Promise<void>;
  /** Reset all session data (distance, calories, cycles, etc.) */
  resetSessionData: () => void;
  /** Reset trigger for UI components */
  resetTrigger: number;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * BLE Context instance
 * Provides BLE functionality to components throughout the app
 */
const BLEContext = createContext<BLEContextType | undefined>(undefined);

// ============================================================================
// CONTEXT HOOK
// ============================================================================

/**
 * Custom hook to access the BLE context
 * 
 * Provides a convenient way to access BLE functionality from any component.
 * Must be used within a BLEProvider component.
 * 
 * @returns BLEContextType - The BLE context with all properties and methods
 * 
 * @throws Error if used outside of a BLEProvider
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { isConnected, currentSpeed, startScan } = useBLE();
 *   
 *   return (
 *     <View>
 *       <Text>Connected: {isConnected ? 'Yes' : 'No'}</Text>
 *       <Text>Speed: {currentSpeed} km/h</Text>
 *       <Button title="Scan" onPress={startScan} />
 *     </View>
 *   );
 * };
 * ```
 */
export const useBLE = () => {
  const context = useContext(BLEContext);
  if (!context) {
    throw new Error('useBLE must be used within a BLEProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER PROPS
// ============================================================================

/**
 * Props for the BLEProvider component
 */
interface BLEProviderProps {
  /** React components to be wrapped by the BLE provider */
  children: ReactNode;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * BLE Provider Component
 * 
 * Wraps the application (or a portion of it) to provide BLE functionality
 * to all child components. Manages BLE state and provides methods for
 * device interaction.
 * 
 * @param props - Provider properties
 * @param props.children - Child components to receive BLE context
 * 
 * @example
 * ```tsx
 * const App = () => {
 *   return (
 *     <BLEProvider>
 *       <HomeScreen />
 *       <BLEScreen />
 *     </BLEProvider>
 *   );
 * };
 * ```
 */
export const BLEProvider: React.FC<BLEProviderProps> = ({ children }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /** Connection status - whether a device is currently connected */
  const [isConnected, setIsConnected] = useState(false);
  
  /** Currently connected device information */
  const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
  
  /** Scanning status - whether device discovery is active */
  const [isScanning, setIsScanning] = useState(false);
  
  /** List of discovered BLE devices */
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  
  /** Permission status - whether Bluetooth permissions are granted */
  const [hasPermissions, setHasPermissions] = useState(false);
  
  /** Current cycling speed in km/h */
  const [currentSpeed, setCurrentSpeed] = useState(0);
  
  /** Current distance traveled in km */
  const [currentDistance, setCurrentDistance] = useState(0);
  
  /** Current calories burned */
  const [currentCycles, setCurrentCycles] = useState(0);
  
  /** Current calories burned */
  const [currentCalories, setCurrentCalories] = useState(0);
  
  /** Current cadence in revolutions per minute */
  const [currentRpm, setCurrentRpm] = useState(0);
  
  /** Current characteristic values from connected device */
  const [characteristicValues, setCharacteristicValues] = useState<CharacteristicValue[]>([]);

  // ============================================================================
  // SESSION TRACKING STATE
  // ============================================================================

  /** Current active session */
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(null);
  
  /** Current session ref for interval access */
  const currentSessionRef = useRef<ActiveSession | null>(null);
  
  /** List of completed sessions */
  const [completedSessions, setCompletedSessions] = useState<CyclingSession[]>([]);
  
  /** Whether a session is currently active */
  const isSessionActive = !!currentSession;
  
  /** Cloud sync interval reference (cloud every 5s) */
  const cloudSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  /** Speed readings for averaging */
  const speedReadingsRef = useRef<number[]>([]);
  
  /** Track actual cycling time (when speed > 0) */
  const cyclingTimeRef = useRef<number>(0);
  const lastSpeedCheckRef = useRef<number>(0);
  
  /** Reset trigger for UI components */
  const [resetTrigger, setResetTrigger] = useState(0);

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  /**
   * Requests Bluetooth permissions from the user
   * 
   * Checks and requests necessary permissions for BLE operations.
   * Updates the permission state based on the result.
   * 
   * @returns Promise<boolean> - True if permissions granted, false otherwise
   * 
   * @example
   * ```typescript
   * const hasPermissions = await requestPermissions();
   * if (hasPermissions) {
   *   // Can now scan for devices
   *   await startScan();
   * }
   * ```
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const granted = await BLEService.checkPermissions();
      setHasPermissions(granted);
      return granted;
    } catch (error) {
      console.error('Permission request error:', error);
      setHasPermissions(false);
      return false;
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Initialization effect
   * Sets up BLE service callbacks and requests initial permissions
   */
  useEffect(() => {
    // Request permissions on mount
    requestPermissions();

    // Setup BLEService callbacks for state synchronization
    BLEService.setCallbacks({
      /**
       * Handles Bluetooth state changes
       * Updates context state and shows appropriate user notifications
       */
      onStateChange: (state) => {
        console.log('Bluetooth state:', state);
        
        if (state === 'PoweredOff') {
          // Bluetooth turned off - clear connection state
          setIsConnected(false);
          setConnectedDevice(null);
          Alert.alert(
            'Bluetooth is Off',
            'Please turn on Bluetooth to use this app',
            [{ text: 'OK' }]
          );
        } else if (state === 'Unauthorized') {
          // Permissions revoked - update state and show alert
          setHasPermissions(false);
          Alert.alert(
            'Bluetooth Permission Required',
            'This app needs Bluetooth permissions to work. Please grant permissions in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Grant Permissions', onPress: requestPermissions }
            ]
          );
        } else if (state === 'PoweredOn') {
          // Bluetooth turned on - update permission state
          setHasPermissions(true);
        }
      },
      
      /**
       * Handles device list changes
       * Updates the devices state when new devices are discovered
       */
      onDevicesChange: (newDevices) => {
        setDevices(newDevices);
      },
      
      /**
       * Handles connection status changes
       * Updates connection state when devices connect or disconnect
       */
      onConnectionChange: async (connected, device) => {
        console.log('SESSION [BLE_CONTEXT] Connection status changed:', connected ? 'CONNECTED' : 'DISCONNECTED');
        setIsConnected(connected);
        setConnectedDevice(device);

        if (connected) {
          console.log('SESSION [BLE_CONTEXT] BLE connected');
        } else {
          console.log('SESSION [BLE_CONTEXT] BLE disconnected, stopping session');
          await stopSession();
        }
      },
      
      /**
       * Handles characteristic value changes
       * Updates characteristic values when new data is received
       */
      onCharacteristicValuesChange: (values) => {
        setCharacteristicValues(values);
      },
      
      /**
       * Handles cycling data changes
       * Updates speed, distance, and calories when new cycling data is received
       */
      onCyclingDataChange: (data: CyclingData) => {
        console.log('📊 BLE Data received:', {
          speed: data.speed,
          distance: data.distance,
          cycles: data.cycles,
          rpm: data.rpm
        });
        
        setCurrentSpeed(data.speed);
        setCurrentDistance(data.distance);
        setCurrentCycles(data.cycles);
        if (typeof data.rpm === 'number') {
          setCurrentRpm(data.rpm);
        }
        
        // Update session with real BLE data
        updateSessionData(data);
      },
    });

    // Cleanup function to remove callbacks when component unmounts
    return () => {
      BLEService.setCallbacks({});
      if (cloudSyncIntervalRef.current) {
        clearInterval(cloudSyncIntervalRef.current);
        cloudSyncIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Functions are stable via useCallback

  /**
   * Cleanup session on unmount
   */
  useEffect(() => {
    return () => {
      stopCloudSync();
    };
  }, []);

  // ============================================================================
  // SESSION MANAGEMENT METHODS
  // ============================================================================

  /**
   * Start a new cycling session
   */
  const startSession = useCallback(async (userId: string): Promise<boolean> => {
    console.log('SESSION [BLE_CONTEXT] Starting session for user:', userId);

    try {
      if (currentSession) {
        console.log('SESSION [BLE_CONTEXT] Stopping previous session');
        await stopSession();
      }

      console.log('SESSION [BLE_CONTEXT] Creating new session');
      
      const sessionId = SessionUtils.generateSessionId();
      const now = Date.now();
      
      // Get user weight from profile for MET calculation
      let userWeight = 70; // Default weight
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('weight_kg')
          .eq('id', userId)
          .single();
        
        if (userProfile?.weight_kg && userProfile.weight_kg > 0) {
          userWeight = userProfile.weight_kg;
          console.log('SESSION [BLE_CONTEXT] User weight loaded:', userWeight, 'kg');
        } else {
          console.log('SESSION [BLE_CONTEXT] Using default weight:', userWeight, 'kg');
        }
      } catch (error) {
        console.log('SESSION [BLE_CONTEXT] Could not load user weight, using default:', userWeight, 'kg');
      }
      
      const newSession: CyclingSession = {
        id: sessionId,
        userId,
        startTime: now,
        totalDistance: 0,
        totalCalories: 0,
        totalCycles: 0,
        maxSpeed: 0,
        avgSpeed: 0,
        duration: 0,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
        isSynced: false,
        userWeight,
      };

      const activeSession: ActiveSession = {
        session: newSession,
        currentSpeed: 0,
        currentDistance: 0,
        currentCycles: 0,
        currentCalories: 0,
        elapsedTime: 0,
        lastSaveTime: now,
        isConnected: true,
        speedReadings: [],
        maxSpeedReadings: 60, // Keep last 60 readings
      };

      setCurrentSession(activeSession);
      currentSessionRef.current = activeSession;
      speedReadingsRef.current = [];
      
      // Reset cycling time tracking for new session
      cyclingTimeRef.current = 0;
      lastSpeedCheckRef.current = 0;

      // Start session in cloud
      await UltraSimpleSync.startSession(newSession);

      // Start cloud sync interval
      startCloudSync();

      console.log('SESSION [BLE_CONTEXT] Session started successfully:', sessionId);
      return true;

    } catch (error) {
      console.error('SESSION [BLE_CONTEXT] ❌ Failed to start session:', error);
      console.error('SESSION [BLE_CONTEXT] ❌ Error details:', error instanceof Error ? error.message : error);
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // currentSession accessed via closure

  /**
   * Stop the current cycling session
   */
  const stopSession = useCallback(async (): Promise<boolean> => {
    console.log('SESSION [BLE_CONTEXT] Stopping session');

    try {
      if (!currentSession) {
        console.log('SESSION [BLE_CONTEXT] No active session to stop');
        return true;
      }

      console.log('SESSION [BLE_CONTEXT] Stopping session:', currentSession.session.id);
        
        // Stop cloud sync
        stopCloudSync();
      
      // Calculate final session data
      const endTime = Date.now();
      const duration = endTime - currentSession.session.startTime;
      const avgSpeed = speedReadingsRef.current.length > 0 
        ? speedReadingsRef.current.reduce((sum, speed) => sum + speed, 0) / speedReadingsRef.current.length
        : 0;

      const finalSession: CyclingSession = {
        ...currentSession.session,
        endTime,
        duration,
        totalDistance: currentSession.currentDistance,
        totalCalories: currentSession.currentCalories,
        totalCycles: currentSession.currentCycles,
        maxSpeed: Math.max(...speedReadingsRef.current, 0),
        avgSpeed,
        isCompleted: true,
        updatedAt: endTime,
      };

      // End session in cloud
      await UltraSimpleSync.endSession(finalSession);

      // Fetch updated sessions list
      await fetchCompletedSessions(finalSession.userId);

      // Clear active session
      setCurrentSession(null);
      currentSessionRef.current = null;
      speedReadingsRef.current = [];

      console.log('SESSION [BLE_CONTEXT] Session completed:', finalSession.id);
      return true;

    } catch (error) {
      console.error('SESSION [BLE_CONTEXT] ❌ Failed to stop session:', error);
      console.error('SESSION [BLE_CONTEXT] ❌ Error details:', error instanceof Error ? error.message : error);
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // currentSession accessed via closure

  /**
   * Update session with current BLE data
   * Prevents hardware reset from overwriting accumulated values
   */
  const updateSessionData = useCallback((data: CyclingData): void => {
    const activeSession = currentSessionRef.current;
    if (!activeSession) {
      return;
    }

    const now = Date.now();
    const elapsedTime = now - activeSession.session.startTime;

    // Add speed reading for averaging
    speedReadingsRef.current.push(data.speed);
    if (speedReadingsRef.current.length > activeSession.maxSpeedReadings) {
      speedReadingsRef.current = speedReadingsRef.current.slice(-activeSession.maxSpeedReadings);
    }

    // Calculate calories using MET-based formula
    // Formula: cal/min = MET * weight_kg * 0.0175, then kcal = cal/min * time_minutes
    // MET for cycling = 7, time in minutes = ACTUAL CYCLING TIME (when speed > 0)
    const MET = 7; // Metabolic Equivalent for cycling
    
    // Track actual cycling time (only when speed > 0)
    const currentTime = Date.now();
    if (lastSpeedCheckRef.current > 0) {
      const timeDiff = currentTime - lastSpeedCheckRef.current;
      if (data.speed > 0) {
        cyclingTimeRef.current += timeDiff;
        console.log('🚴 Cycling time added:', timeDiff, 'ms, total cycling time:', cyclingTimeRef.current, 'ms');
      }
    }
    lastSpeedCheckRef.current = currentTime;
    
    const cyclingTimeInMinutes = cyclingTimeRef.current / 60000; // Convert ms to minutes
    
    // Get user weight from profile (default to 70kg if not available)
    const userWeight = activeSession.session.userWeight || 70;
    
    const caloriesPerMinute = MET * userWeight * 0.0175;
    const calories = Math.round(caloriesPerMinute * cyclingTimeInMinutes);
    
    console.log('🔥 MET Calorie Calculation (Cycling Time):', {
      MET,
      userWeight,
      cyclingTimeInMinutes: cyclingTimeInMinutes.toFixed(2),
      caloriesPerMinute: caloriesPerMinute.toFixed(2),
      totalCalories: calories,
      currentSpeed: data.speed
    });

    // AUTO-RESET: If distance or cycles is 0, reset everything (hardware reset detected)
    if ((data.distance === 0 && activeSession.currentDistance > 0) || 
        (data.cycles === 0 && activeSession.currentCycles > 0)) {
      console.log('🔄 Hardware reset detected (distance/cycles = 0), auto-resetting all data...');
      
      // Reset all values to 0
      setCurrentSpeed(0);
      setCurrentDistance(0);
      setCurrentCycles(0);
      setCurrentCalories(0);
      setCurrentRpm(0);
      
      // Reset cycling time tracking
      cyclingTimeRef.current = 0;
      lastSpeedCheckRef.current = 0;
      
      // Reset speed readings
      speedReadingsRef.current = [];
      
      // Update session with reset values
      const resetTime = Date.now();
      const resetSession: ActiveSession = {
        ...activeSession,
        currentSpeed: 0,
        currentDistance: 0,
        currentCycles: 0,
        currentCalories: 0,
        elapsedTime: 0,
        lastSaveTime: resetTime,
        speedReadings: [],
      };
      
      // Reset session start time to now
      const resetSessionDataObj: CyclingSession = {
        ...resetSession.session,
        startTime: resetTime,
        updatedAt: resetTime,
      };
      
      resetSession.session = resetSessionDataObj;
      
      setCurrentSession(resetSession);
      currentSessionRef.current = resetSession;
      
      // Trigger UI reset
      setResetTrigger(prev => prev + 1);
      
      console.log('✅ Auto-reset completed due to hardware reset (distance/cycles = 0)');
      return; // Exit early since we've reset everything
    }

    // PROTECTION: Prevent hardware reset from overwriting accumulated values
    // Only update distance/cycles/calories if new values are greater than current
    // This prevents hardware reset (0.00) from overwriting accumulated progress
    const protectedDistance = data.distance > activeSession.currentDistance ? data.distance : activeSession.currentDistance;
    const protectedCycles = data.cycles > activeSession.currentCycles ? data.cycles : activeSession.currentCycles;
    const protectedCalories = calories > activeSession.currentCalories ? calories : activeSession.currentCalories;

    console.log('🛡️ Hardware Reset Protection:', {
      incoming: { distance: data.distance, cycles: data.cycles, calories },
      current: { distance: activeSession.currentDistance, cycles: activeSession.currentCycles, calories: activeSession.currentCalories },
      protected: { distance: protectedDistance, cycles: protectedCycles, calories: protectedCalories }
    });

    // Update active session with protected values
    const updatedSession: ActiveSession = {
      ...activeSession,
      currentSpeed: data.speed, // Speed can go to 0 (when stopped)
      currentDistance: protectedDistance,
      currentCycles: protectedCycles,
      currentCalories: protectedCalories,
      elapsedTime,
      speedReadings: speedReadingsRef.current,
    };

    setCurrentSession(updatedSession);
    currentSessionRef.current = updatedSession;
    
    // Update current calories state for UI
    setCurrentCalories(protectedCalories);
  }, []);


  /**
   * Start cloud sync interval (CLOUD every 5 seconds)
   */
  const startCloudSync = (): void => {
    stopCloudSync(); // Clear any existing interval

    cloudSyncIntervalRef.current = setInterval(async () => {
      const session = currentSessionRef.current;
      if (session) {
        try {
          const now = Date.now();
          
          // PROTECTION: Only sync if we have meaningful progress
          // Skip sync if all values are 0 (likely hardware reset)
          const hasProgress = session.currentDistance > 0 || session.currentCycles > 0 || session.currentCalories > 0;
          
          if (!hasProgress) {
            console.log('🛡️ Cloud Sync Skipped - No progress to sync (hardware reset protection)');
            return;
          }

          const sessionToSync: CyclingSession = {
            ...session.session,
            updatedAt: now,
            duration: now - session.session.startTime,
            totalDistance: session.currentDistance,
            totalCalories: session.currentCalories,
            totalCycles: session.currentCycles,
            maxSpeed: Math.max(...speedReadingsRef.current, 0),
            avgSpeed: speedReadingsRef.current.length > 0
              ? speedReadingsRef.current.reduce((sum, speed) => sum + speed, 0) / speedReadingsRef.current.length
              : 0,
          };

          console.log('☁️ Cloud Sync - Protected values:', {
            distance: sessionToSync.totalDistance,
            cycles: sessionToSync.totalCycles,
            calories: sessionToSync.totalCalories
          });

          await UltraSimpleSync.updateSession(sessionToSync);
        } catch (error) {
          console.error('SESSION [BLE_CONTEXT] Cloud sync failed:', error);
        }
      }
    }, 5000); // Sync every 5 seconds
  };

  /**
   * Stop cloud sync interval
   */
  const stopCloudSync = (): void => {
    if (cloudSyncIntervalRef.current) {
      console.log('[BLE] ⏹️ Stopping cloud sync interval');
      clearInterval(cloudSyncIntervalRef.current);
      cloudSyncIntervalRef.current = null;
    }
  };

  /**
   * Fetch completed sessions from cloud
   * @param userId - User ID to fetch sessions for
   */
  const fetchCompletedSessions = async (userId?: string): Promise<void> => {
    try {
      if (!userId) {
        console.warn('⚠️ No userId provided to fetchCompletedSessions');
        return;
      }

      const sessions = await UltraSimpleSync.getUserSessions(userId);
      setCompletedSessions(sessions);
      console.log('📋 Fetched', sessions.length, 'completed sessions');
    } catch (error) {
      console.error('❌ Failed to fetch sessions:', error);
    }
  };

  // ============================================================================
  // BLE OPERATION METHODS
  // ============================================================================

  /**
   * Starts scanning for BLE devices
   * 
   * Initiates device discovery and updates scanning state.
   * Automatically stops after 15 seconds or when manually stopped.
   * 
   * @returns Promise<void> - Resolves when scanning starts
   * 
   * @example
   * ```typescript
   * try {
   *   await startScan();
   *   console.log('Scanning started');
   * } catch (error) {
   *   console.error('Failed to start scan:', error);
   * }
   * ```
   */
  const startScan = async (): Promise<void> => {
    try {
      const success = await BLEService.startScan();
      if (success) {
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Start scan error:', error);
      Alert.alert('Error', 'Failed to start scanning for devices');
    }
  };

  /**
   * Tries direct connection to target device (Android API 31+)
   * 
   * Bypasses scanning and attempts direct connection using MAC address.
   * Useful for devices with BLE scanning issues.
   * 
   * @returns Promise<boolean> - True if connection successful, false otherwise
   * 
   * @example
   * ```typescript
   * const connected = await tryDirectConnection();
   * if (connected) {
   *   console.log('Direct connection successful!');
   * }
   * ```
   */
  const tryDirectConnection = async (): Promise<boolean> => {
    try {
      setIsScanning(true);
      const connected = await BLEService.tryDirectConnection();
      setIsScanning(false);
      return connected;
    } catch (error) {
      console.error('Direct connection error:', error);
      setIsScanning(false);
      return false;
    }
  };

  /**
   * Stops the current device scan
   * 
   * Halts device discovery and updates scanning state.
   * 
   * @example
   * ```typescript
   * stopScan();
   * console.log('Scanning stopped');
   * ```
   */
  const stopScan = (): void => {
    BLEService.stopScan();
    setIsScanning(false);
  };

  /**
   * Connects to a specific BLE device
   * 
   * Attempts to establish a connection with the specified device.
   * Updates connection state based on the result.
   * 
   * @param deviceId - Unique identifier of the device to connect to
   * @returns Promise<void> - Resolves when connection attempt completes
   * 
   * @example
   * ```typescript
   * try {
   *   await connectToDevice('device-123');
   *   console.log('Connected to device');
   * } catch (error) {
   *   console.error('Connection failed:', error);
   * }
   * ```
   */
  const connectToDevice = async (deviceId: string): Promise<void> => {
    try {
      const success = await BLEService.connectToDevice(deviceId);
      if (!success) {
        Alert.alert('Connection Failed', 'Could not connect to the device');
      }
    } catch (error) {
      console.error('Connect to device error:', error);
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  /**
   * Disconnects from the currently connected device
   * 
   * Ends the current connection and clears connection state.
   * 
   * @returns Promise<void> - Resolves when disconnection completes
   * 
   * @example
   * ```typescript
   * await disconnectDevice();
   * console.log('Disconnected from device');
   * ```
   */
  const disconnectDevice = async (): Promise<void> => {
    try {
      await BLEService.disconnectDevice();
    } catch (error) {
      console.error('Disconnect device error:', error);
      Alert.alert('Error', 'Failed to disconnect from device');
    }
  };

  /**
   * Cleanup function for logout - disconnects BLE and saves current session
   * 
   * This function should be called when the user logs out to ensure
   * proper cleanup of BLE connections and session data.
   * 
   * @returns Promise<void> - Resolves when cleanup completes
   * 
   * @example
   * ```typescript
   * await cleanupForLogout();
   * console.log('BLE cleanup completed');
   * ```
   */
  const cleanupForLogout = async (): Promise<void> => {
    try {
      console.log('🧹 Starting BLE cleanup for logout...');
      
      // Stop any active session and save it
      if (currentSession) {
        console.log('💾 Saving current session before logout...');
        await stopSession();
      }
      
      // Disconnect from BLE device
      if (isConnected) {
        console.log('🔌 Disconnecting BLE device...');
        await disconnectDevice();
      }
      
      // Stop cloud sync
      stopCloudSync();
      
      console.log('✅ BLE cleanup completed');
    } catch (error) {
      console.error('❌ BLE cleanup error:', error);
    }
  };

  /**
   * Reset all session data (distance, calories, cycles, etc.)
   * 
   * This function resets all current session metrics to zero while
   * keeping the session active. Useful for starting fresh during a workout.
   * 
   * @example
   * ```typescript
   * resetSessionData();
   * console.log('Session data reset');
   * ```
   */
  const resetSessionData = (): void => {
    try {
      console.log('🔄 Resetting all session data...');
      
      // Reset all current values
      setCurrentSpeed(0);
      setCurrentDistance(0);
      setCurrentCycles(0);
      setCurrentCalories(0);
      setCurrentRpm(0);
      
      // Reset cycling time tracking
      cyclingTimeRef.current = 0;
      lastSpeedCheckRef.current = 0;
      
      // Reset speed readings
      speedReadingsRef.current = [];
      
      // Update current session if it exists
      if (currentSessionRef.current) {
        const now = Date.now();
        const resetSession: ActiveSession = {
          ...currentSessionRef.current,
          currentSpeed: 0,
          currentDistance: 0,
          currentCycles: 0,
          currentCalories: 0,
          elapsedTime: 0,
          lastSaveTime: now, // Reset last save time
          speedReadings: [],
        };
        
        // Also reset the session start time to now
        const resetSessionDataObj: CyclingSession = {
          ...resetSession.session,
          startTime: now, // Reset session start time
          updatedAt: now,
        };
        
        resetSession.session = resetSessionDataObj;
        
        setCurrentSession(resetSession);
        currentSessionRef.current = resetSession;
        
        // Trigger UI reset
        setResetTrigger(prev => prev + 1);
        
        console.log('✅ Session data reset successfully - elapsed time restarted');
      } else {
        console.log('⚠️ No active session to reset');
      }
    } catch (error) {
      console.error('❌ Error resetting session data:', error);
    }
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  /**
   * Context value containing all BLE state and methods
   * This is what gets provided to child components
   */
  const contextValue: BLEContextType = {
    // State
    isConnected,
    connectedDevice,
    isScanning,
    devices,
    hasPermissions,
    characteristicValues,
    currentSpeed,
    currentDistance,
    currentCycles,
    currentCalories,
    currentRpm,
    currentSession,
    isSessionActive,
    completedSessions,
    
    // Methods
    startScan,
    tryDirectConnection,
    stopScan,
    connectToDevice,
    disconnectDevice,
    requestPermissions,
    fetchCompletedSessions,
    startSession,
    stopSession,
    cleanupForLogout,
    resetSessionData,
    resetTrigger,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <BLEContext.Provider value={contextValue}>
      {children}
    </BLEContext.Provider>
  );
};
