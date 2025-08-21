/**
 * @fileoverview Bluetooth Low Energy (BLE) Service for FunFeet Cycling App
 * 
 * This service handles all BLE operations including:
 * - Device scanning and discovery
 * - Connection management
 * - Characteristic monitoring and data processing
 * - Cycling data extraction and real-time updates
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import { BleManager, Device, State, Characteristic } from 'react-native-ble-plx';
import { Platform, Alert, PermissionsAndroid } from 'react-native';

// ============================================================================
// BLE SERVICE CONFIGURATION
// ============================================================================

/**
 * Service UUID for the cycling device
 * This identifies the specific service provided by the BLE device
 */
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";

/**
 * Characteristic UUIDs for different cycling data types
 * Each UUID corresponds to a specific data characteristic on the BLE device
 */
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";  // Speed data
const CHARACTERISTIC_UUID1 = "c0d70848-0a28-4b25-9a3e-02b37d2dc5af"; // Distance data
const CHARACTERISTIC_UUID2 = "a8a43e99-83d2-4f36-8d90-e346f728f4fe"; // Calories data
const CHARACTERISTIC_UUID3 = "42c092ab-08ab-4bf7-a054-f91298078ac3"; // Additional data

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

/**
 * Represents a discovered BLE device
 * Contains basic device information and connection status
 */
export interface BLEDevice {
  /** Unique device identifier */
  id: string;
  /** Human-readable device name */
  name: string | null;
  /** Signal strength indicator (Received Signal Strength Indicator) */
  rssi: number | null;
  /** Current connection status */
  isConnected: boolean;
}

/**
 * Represents a characteristic value with metadata
 * Contains the actual data received from BLE characteristics
 */
export interface CharacteristicValue {
  /** Characteristic UUID */
  uuid: string;
  /** Decoded value from the characteristic */
  value: string | null;
  /** Timestamp of last update */
  lastUpdated: Date;
  /** Human-readable description of the characteristic */
  userDescription?: string;
}

/**
 * Processed cycling data extracted from BLE characteristics
 * Contains the main metrics used throughout the application
 */
export interface CyclingData {
  /** Current speed in km/h */
  speed: number;
  /** Total distance traveled in km */
  distance: number;
  /** Calories burned */
  calories: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Decodes a base64-encoded UTF-8 value from BLE characteristic
 * 
 * @param base64Value - The base64 encoded string from BLE characteristic
 * @returns Decoded UTF-8 string, or original value if decoding fails
 * 
 * @example
 * const decoded = decodeUTF8Value("SGVsbG8="); // Returns "Hello"
 */
const decodeUTF8Value = (base64Value: string): string => {
  try {
    return atob(base64Value);
  } catch (error) {
    console.error('UTF-8 decode error:', error);
    return base64Value;
  }
};

// ============================================================================
// BLE SERVICE CLASS
// ============================================================================

/**
 * Main BLE service class that handles all Bluetooth Low Energy operations
 * 
 * This class provides a complete interface for:
 * - Scanning and discovering BLE devices
 * - Connecting to and managing device connections
 * - Monitoring characteristic values in real-time
 * - Processing and extracting cycling data
 * - Managing connection state and cleanup
 * 
 * @example
 * ```typescript
 * const bleService = new BLEService();
 * bleService.setCallbacks({
 *   onDevicesChange: (devices) => console.log('Devices found:', devices),
 *   onConnectionChange: (connected, device) => console.log('Connection:', connected),
 *   onCyclingDataChange: (data) => console.log('Speed:', data.speed)
 * });
 * ```
 */
class BLEService {
  // ============================================================================
  // PRIVATE PROPERTIES
  // ============================================================================

  /** Core BLE manager instance from react-native-ble-plx */
  private manager: BleManager;
  
  /** Flag indicating if device scanning is currently active */
  private isScanning: boolean = false;
  
  /** Map of discovered devices indexed by device ID */
  private devices: Map<string, BLEDevice> = new Map();
  
  /** Currently connected BLE device */
  private connectedDevice: Device | null = null;
  
  /** Map of discovered characteristics indexed by UUID */
  private characteristics: Map<string, Characteristic> = new Map();
  
  /** Map of characteristic values with metadata */
  private characteristicValues: Map<string, CharacteristicValue> = new Map();
  
  /** Subscription for BLE state changes */
  private connectionStateSubscription: any = null;
  
  /** Subscription for device connection/disconnection events */
  private deviceConnectionSubscription: any = null;
  
  /** Flag indicating if the service has been destroyed */
  private isDestroyed: boolean = false;
  
  /** Current cycling data values */
  private currentSpeed: number = 0;
  private currentDistance: number = 0;
  private currentCalories: number = 0;

  // ============================================================================
  // CALLBACK PROPERTIES
  // ============================================================================

  /** Callback for BLE state changes */
  private onStateChange?: (state: any) => void;
  
  /** Callback for device list changes */
  private onDevicesChange?: (devices: BLEDevice[]) => void;
  
  /** Callback for connection status changes */
  private onConnectionChange?: (isConnected: boolean, device: BLEDevice | null) => void;
  
  /** Callback for characteristic value changes */
  private onCharacteristicValuesChange?: (values: CharacteristicValue[]) => void;
  
  /** Callback for processed cycling data changes */
  private onCyclingDataChange?: (data: CyclingData) => void;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  /**
   * Initializes the BLE service
   * Creates the BLE manager and sets up connection state monitoring
   */
  constructor() {
    this.manager = new BleManager();
    this.setupConnectionStateMonitoring();
  }

  // ============================================================================
  // PUBLIC METHODS - CALLBACK MANAGEMENT
  // ============================================================================

  /**
   * Sets up callback functions for various BLE events
   * 
   * @param callbacks - Object containing callback functions
   * @param callbacks.onStateChange - Called when BLE state changes
   * @param callbacks.onDevicesChange - Called when device list changes
   * @param callbacks.onConnectionChange - Called when connection status changes
   * @param callbacks.onCharacteristicValuesChange - Called when characteristic values change
   * @param callbacks.onCyclingDataChange - Called when processed cycling data changes
   * 
   * @example
   * ```typescript
   * bleService.setCallbacks({
   *   onDevicesChange: (devices) => setDevices(devices),
   *   onConnectionChange: (connected) => setIsConnected(connected),
   *   onCyclingDataChange: (data) => setSpeed(data.speed)
   * });
   * ```
   */
  setCallbacks(callbacks: {
    onStateChange?: (state: any) => void;
    onDevicesChange?: (devices: BLEDevice[]) => void;
    onConnectionChange?: (isConnected: boolean, device: BLEDevice | null) => void;
    onCharacteristicValuesChange?: (values: CharacteristicValue[]) => void;
    onCyclingDataChange?: (data: CyclingData) => void;
  }) {
    this.onStateChange = callbacks.onStateChange;
    this.onDevicesChange = callbacks.onDevicesChange;
    this.onConnectionChange = callbacks.onConnectionChange;
    this.onCharacteristicValuesChange = callbacks.onCharacteristicValuesChange;
    this.onCyclingDataChange = callbacks.onCyclingDataChange;
  }

  // ============================================================================
  // PRIVATE METHODS - CONNECTION STATE MANAGEMENT
  // ============================================================================

  /**
   * Sets up monitoring for BLE connection state changes
   * Handles Bluetooth powered off and unauthorized states
   */
  private setupConnectionStateMonitoring(): void {
    this.connectionStateSubscription = this.manager.onStateChange((state) => {
      console.log('Bluetooth state changed:', state);
      
      if (this.onStateChange) {
        this.onStateChange(state);
      }
      
      if (state === State.PoweredOff) {
        this.handleBluetoothPoweredOff();
      } else if (state === State.Unauthorized) {
        this.handleBluetoothUnauthorized();
      }
    }, true);
  }

  /**
   * Handles Bluetooth being powered off
   * Cleans up all connections and notifies listeners
   */
  private handleBluetoothPoweredOff(): void {
    console.log('Bluetooth powered off - cleaning up connections');
    this.cleanupConnections();
  }

  /**
   * Handles Bluetooth access being unauthorized
   * Shows alert to user about permission requirements
   */
  private handleBluetoothUnauthorized(): void {
    Alert.alert(
      'Bluetooth Permission Required',
      'Please grant Bluetooth permission in your device settings to use this feature.'
    );
  }

  /**
   * Cleans up all active connections and subscriptions
   * Called when Bluetooth is powered off or service is destroyed
   */
  private cleanupConnections(): void {
    if (this.connectedDevice) {
      this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
    
    this.characteristics.clear();
    this.characteristicValues.clear();
    
    if (this.onConnectionChange) {
      this.onConnectionChange(false, null);
    }
    
    if (this.onCharacteristicValuesChange) {
      this.onCharacteristicValuesChange([]);
    }
  }

  // ============================================================================
  // PRIVATE METHODS - NOTIFICATION HELPERS
  // ============================================================================

  /**
   * Notifies listeners of device list changes
   */
  private notifyDevicesChange(): void {
    if (this.onDevicesChange) {
      this.onDevicesChange(Array.from(this.devices.values()));
    }
  }

  /**
   * Notifies listeners of connection status changes
   * 
   * @param isConnected - Current connection status
   * @param device - Connected device or null if disconnected
   */
  private notifyConnectionChange(isConnected: boolean, device: BLEDevice | null): void {
    if (this.onConnectionChange) {
      this.onConnectionChange(isConnected, device);
    }
  }

  /**
   * Notifies listeners of characteristic value changes
   */
  private notifyCharacteristicValuesChange(): void {
    if (this.onCharacteristicValuesChange) {
      this.onCharacteristicValuesChange(Array.from(this.characteristicValues.values()));
    }
  }

  // ============================================================================
  // PUBLIC METHODS - PERMISSION MANAGEMENT
  // ============================================================================

  /**
   * Checks and requests necessary permissions for BLE operations
   * Handles different permission requirements for Android and iOS
   * 
   * @returns Promise<boolean> - True if permissions are granted, false otherwise
   * 
   * @example
   * ```typescript
   * const hasPermissions = await bleService.checkPermissions();
   * if (hasPermissions) {
   *   await bleService.startScan();
   * }
   * ```
   */
  async checkPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs location permission to scan for Bluetooth devices.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission granted');
          return true;
        } else {
          console.log('Location permission denied');
          Alert.alert('Permission Required', 'Location permission is required to scan for Bluetooth devices.');
          return false;
        }
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }
    
    // iOS handles permissions automatically through Info.plist
    return true;
  }

  // ============================================================================
  // PUBLIC METHODS - BLUETOOTH STATE MANAGEMENT
  // ============================================================================

  /**
   * Checks if Bluetooth is enabled and available
   * Validates various Bluetooth states and shows appropriate alerts
   * 
   * @returns Promise<boolean> - True if Bluetooth is ready, false otherwise
   */
  async checkAndEnableBluetooth(): Promise<boolean> {
    try {
      const state = await this.manager.state();
      
      if (state === State.PoweredOff) {
        Alert.alert('Bluetooth Required', 'Please enable Bluetooth to scan for devices.');
        return false;
      }
      
      if (state === State.Unauthorized) {
        Alert.alert('Bluetooth Required', 'Bluetooth access is unauthorized.');
        return false;
      }
      
      if (state === State.Unsupported) {
        Alert.alert('Bluetooth Required', 'Bluetooth is not supported on this device.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Bluetooth check failed:', error);
      return false;
    }
  }

  // ============================================================================
  // PUBLIC METHODS - DEVICE SCANNING
  // ============================================================================

  /**
   * Starts scanning for BLE devices
   * Handles permissions, Bluetooth state, and device discovery
   * 
   * @returns Promise<boolean> - True if scanning started successfully, false otherwise
   * 
   * @example
   * ```typescript
   * const scanStarted = await bleService.startScan();
   * if (scanStarted) {
   *   console.log('Scanning for devices...');
   * }
   * ```
   */
  async startScan(): Promise<boolean> {
    try {
      // Check permissions first
      const permissionsOK = await this.checkPermissions();
      if (!permissionsOK) return false;

      // Check Bluetooth state
      const bluetoothOK = await this.checkAndEnableBluetooth();
      if (!bluetoothOK) return false;

      // Prevent multiple simultaneous scans
      if (this.isScanning) return true;

      // Start scanning
      this.isScanning = true;
      this.devices.clear();
      this.notifyDevicesChange();
      
      // Configure scan parameters and start device discovery
      this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          console.error('Scan error:', error.message);
          this.isScanning = false;
          return;
        }

        // Add valid devices to the list
        if (device && device.id && device.name && device.name.trim() !== '') {
          const bleDevice: BLEDevice = {
            id: device.id,
            name: device.name,
            rssi: device.rssi,
            isConnected: false,
          };
          this.devices.set(device.id, bleDevice);
          this.notifyDevicesChange();
        }
      });

      // Auto-stop scan after 15 seconds
      setTimeout(() => {
        this.stopScan();
      }, 15000);

      return true;
    } catch (error) {
      console.error('Start scan error:', error);
      this.isScanning = false;
      Alert.alert('Error', 'Failed to start scanning.');
      return false;
    }
  }

  /**
   * Stops the current device scan
   * Cleans up scanning state and resources
   */
  stopScan(): void {
    try {
      this.manager.stopDeviceScan();
      this.isScanning = false;
    } catch (error) {
      console.error('Stop scan error:', error);
      this.isScanning = false;
    }
  }

  /**
   * Gets the current list of discovered devices
   * 
   * @returns Array of discovered BLE devices
   */
  getDevices(): BLEDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Gets the current scanning state
   * 
   * @returns True if currently scanning, false otherwise
   */
  getIsScanning(): boolean {
    return this.isScanning;
  }

  // ============================================================================
  // PUBLIC METHODS - DEVICE CONNECTION
  // ============================================================================

  /**
   * Connects to a specific BLE device
   * Handles connection, service discovery, and characteristic setup
   * 
   * @param deviceId - Unique identifier of the device to connect to
   * @returns Promise<boolean> - True if connection successful, false otherwise
   * 
   * @example
   * ```typescript
   * const connected = await bleService.connectToDevice('device-123');
   * if (connected) {
   *   console.log('Successfully connected to device');
   * }
   * ```
   */
  async connectToDevice(deviceId: string): Promise<boolean> {
    if (this.isDestroyed) return false;
    
    try {
      // Disconnect from any existing device
      if (this.connectedDevice) {
        await this.disconnectDevice();
      }

      // Find the device by ID
      const device = await this.manager.devices([deviceId]);
      if (device.length === 0) {
        Alert.alert('Error', 'Device not found');
        return false;
      }

      // Connect to the device
      const connectedDevice = await device[0].connect();
      
      // Setup connection monitoring for this device
      this.deviceConnectionSubscription = connectedDevice.onDisconnected((error, device) => {
        console.log('Device disconnected:', device?.id, error);
        this.handleDeviceDisconnection(deviceId);
      });

      // Discover all services and characteristics
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      this.connectedDevice = connectedDevice;
      
      // Discover our specific service and characteristics
      const discoverySuccess = await this.discoverServiceAndCharacteristics();
      if (!discoverySuccess) {
        Alert.alert('Warning', 'Connected but could not find expected service/characteristics');
      }
      
      // Update device status
      const bleDevice = this.devices.get(deviceId);
      if (bleDevice) {
        bleDevice.isConnected = true;
        this.devices.set(deviceId, bleDevice);
        this.notifyDevicesChange();
        this.notifyConnectionChange(true, bleDevice);
      }

      Alert.alert('Success', 'Connected to device!');
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', 'Could not connect to the device.');
      return false;
    }
  }

  /**
   * Handles device disconnection events
   * Cleans up resources and notifies listeners
   * 
   * @param deviceId - ID of the disconnected device
   */
  private handleDeviceDisconnection(deviceId: string): void {
    console.log('Handling device disconnection for:', deviceId);
    
    // Update device status
    const bleDevice = this.devices.get(deviceId);
    if (bleDevice) {
      bleDevice.isConnected = false;
      this.devices.set(deviceId, bleDevice);
    }
    
    // Clean up resources
    this.connectedDevice = null;
    this.characteristics.clear();
    this.characteristicValues.clear();
    
    // Notify listeners
    this.notifyDevicesChange();
    this.notifyConnectionChange(false, null);
    this.notifyCharacteristicValuesChange();
    
    console.log('Device disconnection handled successfully');
  }

  // ============================================================================
  // PRIVATE METHODS - SERVICE AND CHARACTERISTIC DISCOVERY
  // ============================================================================

  /**
   * Discovers the target service and characteristics on the connected device
   * Sets up monitoring for characteristic value changes
   * 
   * @returns Promise<boolean> - True if discovery successful, false otherwise
   */
  async discoverServiceAndCharacteristics(): Promise<boolean> {
    if (!this.connectedDevice) return false;

    try {
      // Get all services
      const services = await this.connectedDevice.services();
      const targetService = services.find(service => service.uuid.toLowerCase() === SERVICE_UUID.toLowerCase());
      
      if (!targetService) {
        console.log('Target service not found');
        return false;
      }

      // Get all characteristics from the target service
      const characteristics = await targetService.characteristics();
      const targetCharacteristicUuids = [
        CHARACTERISTIC_UUID,
        CHARACTERISTIC_UUID1,
        CHARACTERISTIC_UUID2,
        CHARACTERISTIC_UUID3
      ];

      let foundCount = 0;
      for (const uuid of targetCharacteristicUuids) {
        const characteristic = characteristics.find(c => c.uuid.toLowerCase() === uuid.toLowerCase());
        if (characteristic) {
          this.characteristics.set(uuid, characteristic);
          foundCount++;
          
          // Extract User Descriptor for better identification
          let userDescriptor = null;
          try {
            const descriptors = await characteristic.descriptors();
            for (const descriptor of descriptors) {
              try {
                const readDescriptor = await descriptor.read();
                const descriptorValue = readDescriptor.value ? decodeUTF8Value(readDescriptor.value) : null;
                
                // Check for User Description descriptor (UUID: 0x2901)
                if (descriptor.uuid.toLowerCase() === '00002901-0000-1000-8000-00805f9b34fb') {
                  userDescriptor = descriptorValue;
                  console.log('Found User Descriptor for', uuid, ':', descriptorValue);
                }
              } catch (descReadError) {
                console.log('Failed to read descriptor:', descriptor.uuid, descReadError);
              }
            }
          } catch (descError) {
            console.log('Could not read descriptors for', uuid, ':', descError);
          }
          
          // Initialize characteristic value entry
          this.characteristicValues.set(uuid, {
            uuid,
            value: null,
            lastUpdated: new Date(),
            userDescription: userDescriptor || `Characteristic ${uuid.slice(0, 8)}...`
          });
        }
      }

      this.notifyCharacteristicValuesChange();
      await this.startMonitoringCharacteristics();
      return foundCount > 0;
    } catch (error) {
      console.error('Service/characteristic discovery failed:', error);
      return false;
    }
  }

  // ============================================================================
  // PRIVATE METHODS - CHARACTERISTIC MONITORING
  // ============================================================================

  /**
   * Starts monitoring all notifiable characteristics for value changes
   * Sets up real-time data reception from the BLE device
   */
  async startMonitoringCharacteristics(): Promise<void> {
    if (this.isDestroyed || !this.connectedDevice) return;
    
    for (const [uuid, characteristic] of this.characteristics) {
      try {
        if (characteristic.isNotifiable) {
          await characteristic.monitor((error, characteristic) => {
            if (this.isDestroyed) return;
            
            if (error) {
              console.error('Notification error for', uuid, ':', error);
              return;
            }
            
            if (characteristic && characteristic.value) {
              try {
                const rawValue = characteristic.value;
                const decodedValue = decodeUTF8Value(rawValue);
                
                console.log('Notification received for', uuid, ':', decodedValue);
                
                // Update characteristic value
                const existingChar = this.characteristicValues.get(uuid);
                const userDescriptor = existingChar?.userDescription || 'No descriptor';
                
                this.characteristicValues.set(uuid, {
                  uuid,
                  value: decodedValue,
                  lastUpdated: new Date(),
                  userDescription: userDescriptor
                });

                // Notify listeners and process cycling data
                this.notifyCharacteristicValuesChange();
                this.processCyclingData(uuid, decodedValue);
              } catch (valueError) {
                console.error('Error processing notification value for', uuid, ':', valueError);
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to start monitoring for', uuid, ':', error);
      }
    }
  }

  // ============================================================================
  // PRIVATE METHODS - DATA PROCESSING
  // ============================================================================

  /**
   * Processes cycling data from characteristic values
   * Extracts speed, distance, and calories from different characteristics
   * 
   * @param uuid - Characteristic UUID
   * @param value - Decoded characteristic value
   */
  private processCyclingData(uuid: string, value: string) {
    try {
      let cyclingData: CyclingData = { speed: 0, distance: 0, calories: 0 };
      
      // Parse the value based on characteristic UUID
      if (uuid.toLowerCase() === CHARACTERISTIC_UUID.toLowerCase()) {
        cyclingData.speed = parseFloat(value) || 0;
        this.currentSpeed = cyclingData.speed;
      } else if (uuid.toLowerCase() === CHARACTERISTIC_UUID1.toLowerCase()) {
        cyclingData.distance = parseFloat(value) || 0;
        this.currentDistance = cyclingData.distance;
      } else if (uuid.toLowerCase() === CHARACTERISTIC_UUID2.toLowerCase()) {
        cyclingData.calories = parseFloat(value) || 0;
        this.currentCalories = cyclingData.calories;
      }
      
      // Notify listeners of cycling data changes
      if (this.onCyclingDataChange) {
        this.onCyclingDataChange(cyclingData);
      }
    } catch (error) {
      console.error('Error processing cycling data:', error);
    }
  }

  // ============================================================================
  // PUBLIC METHODS - DISCONNECTION AND CLEANUP
  // ============================================================================

  /**
   * Disconnects from the currently connected device
   * Cleans up all resources and subscriptions
   */
  async disconnectDevice(): Promise<void> {
    try {
      if (this.connectedDevice) {
        await this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
      }
      
      this.characteristics.clear();
      this.characteristicValues.clear();
      
      this.notifyConnectionChange(false, null);
      this.notifyCharacteristicValuesChange();
      
      console.log('Device disconnected successfully');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  /**
   * Destroys the BLE service and cleans up all resources
   * Should be called when the service is no longer needed
   */
  destroy(): void {
    this.isDestroyed = true;
    
    if (this.connectionStateSubscription) {
      this.connectionStateSubscription.remove();
    }
    
    if (this.deviceConnectionSubscription) {
      this.deviceConnectionSubscription.remove();
    }
    
    this.stopScan();
    this.disconnectDevice();
    
    console.log('BLE Service destroyed');
  }

  // ============================================================================
  // PUBLIC METHODS - DATA ACCESS
  // ============================================================================

  /**
   * Gets the current cycling data values
   * 
   * @returns Object containing current speed, distance, and calories
   */
  getCurrentCyclingData(): CyclingData {
    return {
      speed: this.currentSpeed,
      distance: this.currentDistance,
      calories: this.currentCalories
    };
  }

  /**
   * Gets all characteristic values
   * 
   * @returns Array of characteristic values with metadata
   */
  getCharacteristicValues(): CharacteristicValue[] {
    return Array.from(this.characteristicValues.values());
  }

  /**
   * Gets the connection status
   * 
   * @returns True if connected to a device, false otherwise
   */
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }
}

// Export singleton instance
export default new BLEService();
 