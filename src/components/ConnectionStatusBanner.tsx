import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface ConnectionStatusBannerProps {
  isConnected: boolean;
  deviceName?: string;
  onDisconnect?: () => void;
}

const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  isConnected,
  deviceName,
  onDisconnect,
}) => {
  if (isConnected) {
    return (
      <View style={styles.bannerContainer}>
        <View style={[styles.banner, styles.connectedBanner]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.connectedDot]} />
            <Text style={styles.statusText}>Connected to Bike</Text>
            {onDisconnect && (
              <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.deviceName}>{deviceName || 'Unknown Device'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bannerContainer}>
      <View style={[styles.banner, styles.disconnectedBanner]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, styles.disconnectedDot]} />
          <Text style={styles.statusText}>Bike Disconnected</Text>
        </View>
        <Text style={styles.connectText}>Go to Bluetooth screen to connect</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  connectedBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)', // Green
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  disconnectedBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)', // Red
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  connectedDot: {
    backgroundColor: '#FFFFFF',
  },
  disconnectedDot: {
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  disconnectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disconnectText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deviceName: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
    marginLeft: 18,
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
    marginLeft: 18,
    fontStyle: 'italic',
  },
});

export default ConnectionStatusBanner; 