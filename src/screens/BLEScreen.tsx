/**
 * @fileoverview BLE Screen Component for FunFeet Cycling App
 * 
 * This screen provides a comprehensive interface for Bluetooth Low Energy (BLE) device management.
 * It allows users to:
 * - Scan for and discover nearby BLE devices
 * - Connect to and disconnect from cycling devices
 * - View real-time characteristic data from connected devices
 * - Monitor cycling metrics (speed, distance, calories)
 * - Manage Bluetooth permissions
 * 
 * The screen integrates with the BLE context to provide real-time data
 * and device management capabilities.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useBLE } from '../contexts/BLEContext';

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * BLEScreen Component
 * 
 * Main interface for Bluetooth Low Energy device management and monitoring.
 * Provides device scanning, connection management, and real-time data display.
 * 
 * Features:
 * - Device discovery and scanning
 * - Connection management (connect/disconnect)
 * - Real-time characteristic value monitoring
 * - Cycling data summary display
 * - Permission management
 * 
 * @example
 * ```tsx
 * <BLEScreen />
 * ```
 */
const BLEScreen: React.FC = () => {
  // ============================================================================
  // BLE CONTEXT INTEGRATION
  // ============================================================================

  /** BLE context providing device management and data access */
  const {
    devices,
    isScanning,
    isConnected,
    connectedDevice,
    hasPermissions,
    characteristicValues,
    currentSpeed,
    currentDistance,
    currentCalories,
    startScan,
    stopScan,
    connectToDevice,
    disconnectDevice,
    requestPermissions,
  } = useBLE();

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles scan button press
   * Toggles between starting and stopping device scanning
   * 
   * If currently scanning, stops the scan
   * If not scanning, starts a new scan for devices
   */
  const handleScan = async () => {
    if (isScanning) {
      stopScan();
    } else {
      await startScan();
    }
  };

  /**
   * Handles device connection/disconnection
   * 
   * @param deviceId - Unique identifier of the target device
   * 
   * If device is already connected, disconnects from it
   * If device is not connected, attempts to connect to it
   */
  const handleConnect = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device?.isConnected) {
      await disconnectDevice();
    } else {
      await connectToDevice(deviceId);
    }
  };

  /**
   * Handles permission request
   * Requests necessary Bluetooth permissions and shows alert if denied
   * 
   * Displays an alert to guide users to device settings if permissions
   * are not granted
   */
  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permissions Required',
        'Bluetooth permissions are required to use this feature. Please grant permissions in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  /**
   * Renders a single device item in the device list
   * 
   * @param item - Device object containing id, name, rssi, and connection status
   * @returns JSX element for the device item
   */
  const renderDevice = ({ item }: { item: any }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {item.name || `Device ${item.id.slice(-6)}`}
        </Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        {item.rssi && (
          <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.connectButton,
          item.isConnected && styles.disconnectButton
        ]}
        onPress={() => handleConnect(item.id)}
      >
        <Text style={styles.connectButtonText}>
          {item.isConnected ? 'Disconnect' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Renders a single characteristic value item
   * 
   * @param item - Characteristic value object containing uuid, value, and metadata
   * @returns JSX element for the characteristic value item
   */
  const renderCharacteristicValue = ({ item }: { item: any }) => (
    <View style={styles.characteristicItem}>
      <View style={styles.characteristicInfo}>
        <Text style={styles.characteristicLabel}>
          {item.userDescription || 'Unknown Characteristic'}
        </Text>
        <Text style={styles.characteristicUuid}>
          UUID: {item.uuid}
        </Text>
        <Text style={styles.characteristicValue}>
          Value: {item.value || 'No value'}
        </Text>
        <Text style={styles.characteristicTime}>
          Updated: {item.lastUpdated.toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bluetooth Devices</Text>
          <Text style={styles.headerSubtitle}>
            {isScanning ? 'Scanning for devices...' : 'Ready to scan'}
          </Text>
        </View>

        {/* Permissions Section */}
        {!hasPermissions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permissions Required</Text>
            <Text style={styles.sectionDescription}>
              Bluetooth permissions are required to scan for and connect to devices.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleRequestPermissions}
            >
              <Text style={styles.permissionButtonText}>Grant Permissions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scan Control Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Discovery</Text>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanningButton]}
            onPress={handleScan}
            disabled={!hasPermissions}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Stop Scan' : 'Start Scan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Real-Time Cycling Data Summary */}
        {isConnected && characteristicValues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Real-Time Cycling Data ({characteristicValues.length} characteristics)
            </Text>
            <View style={styles.cyclingDataSummary}>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Current Speed</Text>
                <Text style={styles.dataValue}>{currentSpeed.toFixed(1)}</Text>
                <Text style={styles.dataUnit}>Km/h</Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Distance</Text>
                <Text style={styles.dataValue}>{currentDistance.toFixed(1)}</Text>
                <Text style={styles.dataUnit}>Km</Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Calories</Text>
                <Text style={styles.dataValue}>{currentCalories.toFixed(0)}</Text>
                <Text style={styles.dataUnit}>cal</Text>
              </View>
            </View>
            <Text style={styles.subsectionTitle}>Raw Characteristic Data</Text>
            <FlatList
              data={characteristicValues}
              renderItem={renderCharacteristicValue}
              keyExtractor={(item) => item.uuid}
              style={styles.list}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Devices List Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Devices ({devices.length})
          </Text>
          {devices.length === 0 ? (
            <Text style={styles.noDevicesText}>
              {isScanning 
                ? 'Scanning for devices...' 
                : 'No devices found. Start scanning to discover devices.'
              }
            </Text>
          ) : (
            <FlatList
              data={devices}
              renderItem={renderDevice}
              keyExtractor={(item) => item.id}
              style={styles.list}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Connection Status Section */}
        {isConnected && connectedDevice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Status</Text>
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionLabel}>Connected Device:</Text>
              <Text style={styles.connectionValue}>
                {connectedDevice.name || `Device ${connectedDevice.id.slice(-6)}`}
              </Text>
              <Text style={styles.connectionLabel}>Device ID:</Text>
              <Text style={styles.connectionValue}>{connectedDevice.id}</Text>
            </View>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={disconnectDevice}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  /**
   * Main container with white background
   */
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  /**
   * Scroll view container
   */
  scrollView: {
    flex: 1,
  },
  
  /**
   * Header section with title and status
   */
  header: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 10,
  },
  
  /**
   * Header title text
   */
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  
  /**
   * Header subtitle text
   */
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  
  /**
   * Section container
   * Light green background with shadow and rounded corners
   */
  section: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  /**
   * Section title text
   */
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  
  /**
   * Section description text
   */
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
    lineHeight: 20,
  },
  
  /**
   * Permission button
   * Green button for requesting permissions
   */
  permissionButton: {
    backgroundColor: '#20A446',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  /**
   * Permission button text
   */
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  /**
   * Scan button
   * Green button for starting/stopping device scan
   */
  scanButton: {
    backgroundColor: '#20A446',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  /**
   * Scanning button state
   * Different color when actively scanning
   */
  scanningButton: {
    backgroundColor: '#FF9500',
  },
  
  /**
   * Scan button text
   */
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  /**
   * Cycling data summary container
   */
  cyclingDataSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  
  /**
   * Individual data card
   * White background with shadow and rounded corners
   */
  dataCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  
  /**
   * Data label text
   */
  dataLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  
  /**
   * Data value text (large)
   */
  dataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  
  /**
   * Data unit text
   */
  dataUnit: {
    fontSize: 12,
    color: '#666666',
  },
  
  /**
   * Subsection title text
   */
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  
  /**
   * List container
   */
  list: {
    marginTop: 10,
  },
  
  /**
   * No devices text
   */
  noDevicesText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  /**
   * Device item container
   * White background with shadow and rounded corners
   */
  deviceItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  
  /**
   * Device information container
   */
  deviceInfo: {
    flex: 1,
  },
  
  /**
   * Device name text
   */
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  
  /**
   * Device ID text
   */
  deviceId: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  
  /**
   * Device RSSI text
   */
  deviceRssi: {
    fontSize: 12,
    color: '#666666',
  },
  
  /**
   * Connect button
   * Green button for connecting to devices
   */
  connectButton: {
    backgroundColor: '#20A446',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  
  /**
   * Disconnect button
   * Red button for disconnecting from devices
   */
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  
  /**
   * Connect button text
   */
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  /**
   * Characteristic item container
   * Light green background with rounded corners
   */
  characteristicItem: {
    backgroundColor: '#D0E8D0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  
  /**
   * Characteristic information container
   */
  characteristicInfo: {
    gap: 5,
  },
  
  /**
   * Characteristic label text
   */
  characteristicLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  
  /**
   * Characteristic UUID text
   */
  characteristicUuid: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  
  /**
   * Characteristic value text
   */
  characteristicValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  
  /**
   * Characteristic time text
   */
  characteristicTime: {
    fontSize: 12,
    color: '#666666',
  },
  
  /**
   * Connection information container
   */
  connectionInfo: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  
  /**
   * Connection label text
   */
  connectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  
  /**
   * Connection value text
   */
  connectionValue: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  
  /**
   * Disconnect button text
   */
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BLEScreen; 