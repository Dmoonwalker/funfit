/**
 * @fileoverview Real-Time Metrics Section Component
 * 
 * A section component that displays multiple real-time BLE metrics using
 * the RealTimeDataCard components. Provides a clean, organized layout
 * for showing cycling data with live indicators.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { useBLE } from '../contexts/BLEContext';
import RealTimeDataCard from './RealTimeDataCard';

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * RealTimeMetricsSection Component
 * 
 * Displays a section with real-time cycling metrics using the enhanced
 * RealTimeDataCard components. Shows speed, distance, and calories with
 * live data indicators and smooth animations.
 * 
 * @example
 * ```tsx
 * <RealTimeMetricsSection />
 * ```
 */
const RealTimeMetricsSection: React.FC = () => {
  // ============================================================================
  // BLE CONTEXT INTEGRATION
  // ============================================================================

  /** BLE context for real-time cycling data */
  const {
    isConnected,
    currentSpeed,
    currentDistance,
    currentCalories,
  } = useBLE();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Real-Time Metrics</Text>
        {isConnected && (
          <View style={styles.connectionStatus}>
            <View style={styles.connectedDot} />
            <Text style={styles.connectionText}>Connected</Text>
          </View>
        )}
      </View>

      {/* Metrics Cards */}
      <View style={styles.metricsGrid}>
        {/* Speed Card */}
        <RealTimeDataCard
          label="Current Speed"
          value={currentSpeed}
          unit="km/h"
          isLive={isConnected}
          decimalPlaces={1}
          icon={
            <Image
              source={require('../../assets/icons/distance.png')}
              style={styles.metricIcon}
              resizeMode="contain"
            />
          }
          backgroundColor="#E8F5E8"
          valueColor="#20A446"
        />

        {/* Distance Card */}
        <RealTimeDataCard
          label="Total Distance"
          value={currentDistance}
          unit="km"
          isLive={isConnected}
          decimalPlaces={2}
          icon={
            <Image
              source={require('../../assets/icons/distance.png')}
              style={styles.metricIcon}
              resizeMode="contain"
            />
          }
          backgroundColor="#FFF8E1"
          valueColor="#F57C00"
        />

        {/* Calories Card */}
        <RealTimeDataCard
          label="Calories Burned"
          value={currentCalories}
          unit="kcal"
          isLive={isConnected}
          decimalPlaces={0}
          icon={
            <Image
              source={require('../../assets/icons/calories.png')}
              style={styles.metricIcon}
              resizeMode="contain"
            />
          }
          backgroundColor="#FDE7F3"
          valueColor="#E91E63"
        />
      </View>

      {/* Data Source Info */}
      <View style={styles.dataSourceInfo}>
        <Text style={styles.dataSourceText}>
          {isConnected 
            ? '📡 Data streaming live from BLE device'
            : '🔌 Connect to a BLE device to see real-time data'
          }
        </Text>
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  /**
   * Main container for the metrics section
   */
  container: {
    backgroundColor: '#FFFFFF',
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
   * Section header container
   */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  /**
   * Header title text
   */
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },

  /**
   * Connection status indicator
   */
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  /**
   * Connected status dot
   */
  connectedDot: {
    width: 6,
    height: 6,
    backgroundColor: '#20A446',
    borderRadius: 3,
    marginRight: 4,
  },

  /**
   * Connection status text
   */
  connectionText: {
    color: '#20A446',
    fontSize: 12,
    fontWeight: 'bold',
  },

  /**
   * Metrics cards grid container
   */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },

  /**
   * Metric icon styling
   */
  metricIcon: {
    width: 32,
    height: 32,
  },

  /**
   * Data source information container
   */
  dataSourceInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },

  /**
   * Data source text
   */
  dataSourceText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RealTimeMetricsSection;
