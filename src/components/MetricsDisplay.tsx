import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

interface MetricsDisplayProps {
  currentSpeed: number;
  calories: number;
  distance: number;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  currentSpeed,
  calories,
  distance,
}) => {
  return (
    <View style={styles.metricsContainer}>
      <View style={styles.metricCircle}>
        <View style={[styles.metricProgress, { backgroundColor: '#007AFF' }]} />
        <Text style={styles.metricValue}>{currentSpeed}</Text>
        <Text style={styles.metricUnit}>Km/h</Text>
      </View>
      
      <View style={styles.metricCircle}>
        <View style={[styles.metricProgress, { backgroundColor: '#FF9500' }]} />
        <Text style={styles.metricValue}>{calories}</Text>
        <Text style={styles.metricUnit}>cal</Text>
      </View>
      
      <View style={styles.metricCircle}>
        <View style={[styles.metricProgress, { backgroundColor: '#34C759' }]} />
        <Text style={styles.metricValue}>{distance}</Text>
        <Text style={styles.metricUnit}>Km</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metricsContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3A3A3C',
  },
  metricProgress: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  metricUnit: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default MetricsDisplay; 