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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import BLEService, { BLEDevice, CharacteristicValue, CyclingData } from '../services/BLEService';

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
  /** Current calories burned */
  currentCalories: number;
  
  // Methods
  /** Starts scanning for BLE devices */
  startScan: () => Promise<void>;
  /** Stops the current device scan */
  stopScan: () => void;
  /** Connects to a specific BLE device */
  connectToDevice: (deviceId: string) => Promise<void>;
  /** Disconnects from the currently connected device */
  disconnectDevice: () => Promise<void>;
  /** Requests Bluetooth permissions from the user */
  requestPermissions: () => Promise<boolean>;
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
  const [currentCalories, setCurrentCalories] = useState(0);
  
  /** Current characteristic values from connected device */
  const [characteristicValues, setCharacteristicValues] = useState<CharacteristicValue[]>([]);

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
      onConnectionChange: (connected, device) => {
        setIsConnected(connected);
        setConnectedDevice(device);
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
        setCurrentSpeed(data.speed);
        setCurrentDistance(data.distance);
        setCurrentCalories(data.calories);
      },
    });

    // Cleanup function to remove callbacks when component unmounts
    return () => {
      BLEService.setCallbacks({});
    };
  }, []);

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
    currentCalories,
    
    // Methods
    startScan,
    stopScan,
    connectToDevice,
    disconnectDevice,
    requestPermissions,
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
