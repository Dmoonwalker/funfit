import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useBLE } from '../contexts/BLEContext';

interface TopIconsProps {
  onBluetoothPress?: () => void;
  onMenuPress?: () => void;
  onSettingsPress?: () => void;
  onProfilePress?: () => void;
  isConnected?: boolean;
}

const TopIcons: React.FC<TopIconsProps> = ({
  onBluetoothPress,
  onMenuPress,
  onSettingsPress,
  onProfilePress,
  isConnected = false,
}) => {
  const { isScanning } = useBLE();

  return (
    <View style={styles.topIcons}>
      {/* Bluetooth Icon */}
      <TouchableOpacity 
        style={[styles.iconButton, isConnected && styles.connectedButton]} 
        onPress={onBluetoothPress}
      >
        <Text style={styles.icon}>📶</Text>
        {isConnected && (
          <View style={styles.connectionIndicator}>
            <View style={[styles.statusDot, styles.connectedDot]} />
            <Text style={styles.statusText}>Connected</Text>
          </View>
        )}
        {!isConnected && isScanning && (
          <View style={styles.connectionIndicator}>
            <View style={[styles.statusDot, styles.scanningDot]} />
            <Text style={styles.statusText}>Scanning...</Text>
          </View>
        )}
        {!isConnected && !isScanning && (
          <View style={styles.connectionIndicator}>
            <View style={[styles.statusDot, styles.disconnectedDot]} />
            <Text style={styles.statusText}>Disconnected</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Settings Icon */}
      <TouchableOpacity style={styles.iconButton} onPress={onSettingsPress}>
        <Text style={styles.icon}>⚙️</Text>
      </TouchableOpacity>

      {/* Profile Icon */}
      <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
        <Text style={styles.icon}>👤</Text>
      </TouchableOpacity>
      
      {/* Menu Icon */}
      <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
        <Text style={styles.icon}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topIcons: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    position: 'relative',
  },
  connectedButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)', // Green background when connected
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  icon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  connectionIndicator: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 80,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  connectedDot: {
    backgroundColor: '#22C55E', // Green
  },
  disconnectedDot: {
    backgroundColor: '#EF4444', // Red
  },
  scanningDot: {
    backgroundColor: '#F59E0B', // Orange/Yellow
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TopIcons; 