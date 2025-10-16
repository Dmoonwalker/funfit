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

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBLE } from '../contexts/BLEContext';

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * Props for the BLEScreen component
 */
interface BLEScreenProps {
  navigation: any;
}

/**
 * BLEScreen Component
 * 
 * Beautiful blue gradient interface for Bluetooth device connection.
 * Features automatic detection of target device and clean connection UI.
 */
const BLEScreen: React.FC<BLEScreenProps> = ({ navigation: _navigation }) => {
  const {
    devices,
    isScanning,
    isConnected,
    connectedDevice,
    hasPermissions,
    startScan,
    stopScan,
    connectToDevice,
    disconnectDevice,
    requestPermissions,
  } = useBLE();

  // Get screen dimensions for responsive design
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 400 || height < 600;

  // Target device MAC address
  const TARGET_DEVICE_MAC = "00:4B:12:35:0C:AE";
  
  // State for UI
  const [isSearching, setIsSearching] = useState(false);
  
  // Animation for pulsing Bluetooth icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Find target device
  const targetDevice = devices.find(device => 
    device.id === TARGET_DEVICE_MAC || 
    device.id.includes(TARGET_DEVICE_MAC.replace(/:/g, ''))
  );

  /**
   * Handle Turn On - starts scanning for devices
   */
  const handleTurnOn = async () => {
    if (!hasPermissions) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Bluetooth permissions are required to scan for devices.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setIsSearching(true);
    await startScan();
    
    // Let the BLE service handle the timeout (2 minutes)
    // The scan will auto-stop after 2 minutes in BLEService
  };

  // Direct connection feature removed

  /**
   * Handle Turn Off - disconnect and stop scanning
   */
  const handleTurnOff = async () => {
    setIsSearching(false);
    if (isScanning) {
      stopScan();
    }
    if (isConnected) {
      await disconnectDevice();
    }
  };

  /**
   * Handle Connect to target device
   */
  const handleConnectTarget = async () => {
    if (targetDevice) {
      await connectToDevice(targetDevice.id);
    }
  };

  /**
   * Handle Disconnect from target device
   */
  const handleDisconnectTarget = async () => {
    await disconnectDevice();
  };

  // Pulsing animation for Bluetooth icon when searching
  useEffect(() => {
    if (isSearching || isScanning) {
      // Start pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
      };
    } else {
      // Stop animation and reset to normal size
      pulseAnim.setValue(1);
    }
  }, [isSearching, isScanning, pulseAnim]);

  // Log when target device is found (no auto-connect)
  useEffect(() => {
    if (targetDevice && !isConnected && !targetDevice.isConnected) {
      console.log('🎯 Target device found:', targetDevice.id);
    }
  }, [targetDevice, isConnected]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.content,
        isLandscape && styles.landscapeContent
      ]}>
        {isLandscape ? (
          // Landscape layout - side by side
          <>
            {/* Left side - Icon and status */}
            <View style={styles.landscapeLeft}>
              <Animated.View style={[
                styles.bluetoothIconContainer,
                { 
                  width: isSmallScreen ? 60 : 80, 
                  height: isSmallScreen ? 60 : 80,
                  marginBottom: isSmallScreen ? 20 : 30,
                  transform: [{ scale: pulseAnim }]
                }
              ]}>
          <Image 
            source={require('../../assets/icons/bluetooth.png')} 
                  style={[
                    styles.bluetoothIcon,
                    { 
                      width: isSmallScreen ? 30 : 40, 
                      height: isSmallScreen ? 30 : 40 
                    }
                  ]}
                />
              </Animated.View>
              
              {targetDevice && (
                <View style={styles.bikeIconContainer}>
                  <Image 
                    source={require('../../assets/icons/bike.png')} 
                    style={[
                      styles.bikeIcon,
                      { 
                        width: isSmallScreen ? 40 : 50, 
                        height: isSmallScreen ? 40 : 50 
                      }
                    ]}
                  />
                  <Text style={[
                    styles.deviceMacText,
                    { fontSize: isSmallScreen ? 12 : 14 }
                  ]}>
                    {isConnected ? connectedDevice?.id : TARGET_DEVICE_MAC}
                  </Text>
                </View>
              )}
        </View>

            {/* Right side - Text and buttons */}
            <View style={styles.landscapeRight}>
        {!isConnected && !targetDevice && !isSearching ? (
          // Initial state - Search
          <>
                  <Text style={[
                    styles.title,
                    { fontSize: isSmallScreen ? 24 : 28 }
                  ]}>Connect</Text>
                  <Text style={[
                    styles.subtitle,
                    { 
                      fontSize: isSmallScreen ? 14 : 16,
                      marginBottom: isSmallScreen ? 30 : 40
                    }
                  ]}>to your cycling device nearby</Text>
                  
                  <TouchableOpacity style={[
                    styles.actionButton,
                    { 
                      paddingHorizontal: isSmallScreen ? 30 : 40,
                      paddingVertical: isSmallScreen ? 14 : 18,
                      minWidth: isSmallScreen ? 160 : 200
                    }
                  ]} onPress={handleTurnOn}>
                    <Text style={[
                      styles.actionButtonText,
                      { fontSize: isSmallScreen ? 16 : 18 }
                    ]}>Search</Text>
                  </TouchableOpacity>
          </>
        ) : isSearching || isScanning ? (
          // Searching state
          <>
                  <Text style={[
                    styles.title,
                    { fontSize: isSmallScreen ? 24 : 28 }
                  ]}>Searching...</Text>
                  <Text style={[
                    styles.subtitle,
                    { 
                      fontSize: isSmallScreen ? 14 : 16,
                      marginBottom: isSmallScreen ? 30 : 40
                    }
                  ]}>Looking for your cycling device</Text>
                  
                  <TouchableOpacity style={[
                    styles.cancelButton,
                    { 
                      paddingHorizontal: isSmallScreen ? 30 : 40,
                      paddingVertical: isSmallScreen ? 14 : 18,
                      minWidth: isSmallScreen ? 160 : 200
                    }
                  ]} onPress={handleTurnOff}>
                    <Text style={[
                      styles.cancelButtonText,
                      { fontSize: isSmallScreen ? 16 : 18 }
                    ]}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : targetDevice && !isConnected ? (
                // Target device found but not connected
                <>
                  <Text style={[
                    styles.title,
                    { fontSize: isSmallScreen ? 24 : 28 }
                  ]}>Device Found</Text>
                  <Text style={[
                    styles.subtitle,
                    { 
                      fontSize: isSmallScreen ? 14 : 16,
                      marginBottom: isSmallScreen ? 30 : 40
                    }
                  ]}>Your cycling device is ready to connect</Text>
                  
                  <TouchableOpacity style={[
                    styles.actionButton,
                    { 
                      paddingHorizontal: isSmallScreen ? 30 : 40,
                      paddingVertical: isSmallScreen ? 14 : 18,
                      minWidth: isSmallScreen ? 160 : 200
                    }
                  ]} onPress={handleConnectTarget}>
                    <Text style={[
                      styles.actionButtonText,
                      { fontSize: isSmallScreen ? 16 : 18 }
                    ]}>Connect</Text>
                  </TouchableOpacity>
                </>
              ) : isConnected && connectedDevice ? (
                // Connected state
                <>
                  <Text style={[
                    styles.title,
                    { fontSize: isSmallScreen ? 24 : 28 }
                  ]}>Connected</Text>
                  <Text style={[
                    styles.subtitle,
                    { 
                      fontSize: isSmallScreen ? 14 : 16,
                      marginBottom: isSmallScreen ? 30 : 40
                    }
                  ]}>Your cycling device is ready to use</Text>
                  
                  <TouchableOpacity style={[
                    styles.disconnectButton,
                    { 
                      paddingHorizontal: isSmallScreen ? 30 : 40,
                      paddingVertical: isSmallScreen ? 14 : 18,
                      minWidth: isSmallScreen ? 160 : 200
                    }
                  ]} onPress={handleDisconnectTarget}>
                    <Text style={[
                      styles.disconnectButtonText,
                      { fontSize: isSmallScreen ? 16 : 18 }
                    ]}>Disconnect</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Fallback state
                <>
                  <Text style={[
                    styles.title,
                    { fontSize: isSmallScreen ? 24 : 28 }
                  ]}>Bluetooth</Text>
                  <Text style={[
                    styles.subtitle,
                    { 
                      fontSize: isSmallScreen ? 14 : 16,
                      marginBottom: isSmallScreen ? 30 : 40
                    }
                  ]}>Manage your device connection</Text>
                  
                  <TouchableOpacity style={[
                    styles.actionButton,
                    { 
                      paddingHorizontal: isSmallScreen ? 30 : 40,
                      paddingVertical: isSmallScreen ? 14 : 18,
                      minWidth: isSmallScreen ? 160 : 200
                    }
                  ]} onPress={handleTurnOn}>
                    <Text style={[
                      styles.actionButtonText,
                      { fontSize: isSmallScreen ? 16 : 18 }
                    ]}>Search</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        ) : (
          // Portrait layout - original vertical layout
          <>
            {/* Bluetooth Icon */}
            <Animated.View style={[
              styles.bluetoothIconContainer,
              { 
                width: isSmallScreen ? 60 : 80, 
                height: isSmallScreen ? 60 : 80,
                marginBottom: isSmallScreen ? 30 : 40,
                transform: [{ scale: pulseAnim }]
              }
            ]}>
              <Image 
                source={require('../../assets/icons/bluetooth.png')} 
                style={[
                  styles.bluetoothIcon,
                  { 
                    width: isSmallScreen ? 30 : 40, 
                    height: isSmallScreen ? 30 : 40 
                  }
                ]}
              />
            </Animated.View>

            {!isConnected && !targetDevice && !isSearching ? (
              // Initial state - Search
              <>
                <Text style={[
                  styles.title,
                  { fontSize: isSmallScreen ? 28 : 32 }
                ]}>Connect</Text>
                <Text style={[
                  styles.subtitle,
                  { 
                    fontSize: isSmallScreen ? 16 : 18,
                    marginBottom: isSmallScreen ? 40 : 60
                  }
                ]}>to your cycling device nearby</Text>
                
                <TouchableOpacity style={[
                  styles.actionButton,
                  { 
                    paddingHorizontal: isSmallScreen ? 30 : 40,
                    paddingVertical: isSmallScreen ? 14 : 18,
                    minWidth: isSmallScreen ? 160 : 200
                  }
                ]} onPress={handleTurnOn}>
                  <Text style={[
                    styles.actionButtonText,
                    { fontSize: isSmallScreen ? 16 : 18 }
                  ]}>Search</Text>
                </TouchableOpacity>
              </>
            ) : isSearching || isScanning ? (
              // Searching state
              <>
                <Text style={[
                  styles.title,
                  { fontSize: isSmallScreen ? 28 : 32 }
                ]}>Searching...</Text>
                <Text style={[
                  styles.subtitle,
                  { 
                    fontSize: isSmallScreen ? 16 : 18,
                    marginBottom: isSmallScreen ? 40 : 60
                  }
                ]}>Looking for your cycling device</Text>
                
                <TouchableOpacity style={[
                  styles.cancelButton,
                  { 
                    paddingHorizontal: isSmallScreen ? 30 : 40,
                    paddingVertical: isSmallScreen ? 14 : 18,
                    minWidth: isSmallScreen ? 160 : 200
                  }
                ]} onPress={handleTurnOff}>
                  <Text style={[
                    styles.cancelButtonText,
                    { fontSize: isSmallScreen ? 16 : 18 }
                  ]}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : targetDevice && !isConnected ? (
          // Target device found but not connected
          <>
            {/* Bike Icon */}
            <View style={styles.bikeIconContainer}>
              <Image 
                source={require('../../assets/icons/bike.png')} 
                    style={[
                      styles.bikeIcon,
                      { 
                        width: isSmallScreen ? 50 : 60, 
                        height: isSmallScreen ? 50 : 60 
                      }
                    ]}
                  />
                  <Text style={[
                    styles.deviceMacText,
                    { fontSize: isSmallScreen ? 12 : 14 }
                  ]}>{TARGET_DEVICE_MAC}</Text>
            </View>
            
                <Text style={[
                  styles.title,
                  { fontSize: isSmallScreen ? 28 : 32 }
                ]}>Device Found</Text>
                <Text style={[
                  styles.subtitle,
                  { 
                    fontSize: isSmallScreen ? 16 : 18,
                    marginBottom: isSmallScreen ? 40 : 60
                  }
                ]}>Your cycling device is ready to connect</Text>
                
                <TouchableOpacity style={[
                  styles.actionButton,
                  { 
                    paddingHorizontal: isSmallScreen ? 30 : 40,
                    paddingVertical: isSmallScreen ? 14 : 18,
                    minWidth: isSmallScreen ? 160 : 200
                  }
                ]} onPress={handleConnectTarget}>
                  <Text style={[
                    styles.actionButtonText,
                    { fontSize: isSmallScreen ? 16 : 18 }
                  ]}>Connect</Text>
            </TouchableOpacity>
          </>
        ) : isConnected && connectedDevice ? (
          // Connected state
          <>
            {/* Bike Icon */}
            <View style={styles.bikeIconContainer}>
              <Image 
                source={require('../../assets/icons/bike.png')} 
                    style={[
                      styles.bikeIcon,
                      { 
                        width: isSmallScreen ? 50 : 60, 
                        height: isSmallScreen ? 50 : 60 
                      }
                    ]}
                  />
                  <Text style={[
                    styles.deviceMacText,
                    { fontSize: isSmallScreen ? 12 : 14 }
                  ]}>{connectedDevice.id}</Text>
            </View>
            
                <Text style={[
                  styles.title,
                  { fontSize: isSmallScreen ? 28 : 32 }
                ]}>Connected</Text>
                <Text style={[
                  styles.subtitle,
                  { 
                    fontSize: isSmallScreen ? 16 : 18,
                    marginBottom: isSmallScreen ? 40 : 60
                  }
                ]}>Your cycling device is ready to use</Text>
                
                <TouchableOpacity style={[
                  styles.disconnectButton,
                  { 
                    paddingHorizontal: isSmallScreen ? 30 : 40,
                    paddingVertical: isSmallScreen ? 14 : 18,
                    minWidth: isSmallScreen ? 160 : 200
                  }
                ]} onPress={handleDisconnectTarget}>
                  <Text style={[
                    styles.disconnectButtonText,
                    { fontSize: isSmallScreen ? 16 : 18 }
                  ]}>Disconnect</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Fallback state
          <>
                <Text style={[
                  styles.title,
                  { fontSize: isSmallScreen ? 28 : 32 }
                ]}>Bluetooth</Text>
                <Text style={[
                  styles.subtitle,
                  { 
                    fontSize: isSmallScreen ? 16 : 18,
                    marginBottom: isSmallScreen ? 40 : 60
                  }
                ]}>Manage your device connection</Text>
                
                <TouchableOpacity style={[
                  styles.actionButton,
                  { 
                    paddingHorizontal: isSmallScreen ? 30 : 40,
                    paddingVertical: isSmallScreen ? 14 : 18,
                    minWidth: isSmallScreen ? 160 : 200
                  }
                ]} onPress={handleTurnOn}>
                  <Text style={[
                    styles.actionButtonText,
                    { fontSize: isSmallScreen ? 16 : 18 }
                  ]}>Search</Text>
            </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  /**
   * Main container - white background matching app theme
   */
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Content container
   */
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  /**
   * Bluetooth icon container - green theme
   */
  bluetoothIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#20A446',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  /**
   * Bluetooth icon
   */
  bluetoothIcon: {
    width: 40,
    height: 40,
    tintColor: '#FFFFFF',
  },

  /**
   * Bike icon container
   */
  bikeIconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },

  /**
   * Bike icon
   */
  bikeIcon: {
    width: 60,
    height: 60,
    tintColor: '#20A446',
    marginBottom: 12,
  },

  /**
   * Device MAC address text
   */
  deviceMacText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'monospace',
  },

  /**
   * Title text - app green theme
   */
  title: {
    fontSize: 32,
    fontFamily: 'Lexend-Bold',
    color: '#20A446',
    textAlign: 'center',
    marginBottom: 12,
  },

  /**
   * Subtitle text
   */
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 24,
  },

  /**
   * Action button - app green theme
   */
  actionButton: {
    backgroundColor: '#20A446',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  /**
   * Action button text
   */
  actionButtonText: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    color: '#FFFFFF',
  },

  /**
   * Cancel button - secondary style
   */
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#20A446',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },

  /**
   * Cancel button text
   */
  cancelButtonText: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    color: '#20A446',
  },

  /**
   * Disconnect button - red theme
   */
  disconnectButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  /**
   * Disconnect button text
   */
  disconnectButtonText: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    color: '#FFFFFF',
  },

  /**
   * Landscape content container - side by side layout
   */
  landscapeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },

  /**
   * Landscape left side - icons and status
   */
  landscapeLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
  },

  /**
   * Landscape right side - text and buttons
   */
  landscapeRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },
});

export default BLEScreen; 