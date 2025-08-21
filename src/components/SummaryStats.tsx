import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

interface SummaryStatsProps {
  distance: number;
  calories: number;
  badges: number;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({
  distance,
  calories,
  badges,
}) => {
  return (
    <View style={styles.summarySection}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryIcon}>📍</Text>
        <Text style={styles.summaryValue}>{distance} KM</Text>
        <Text style={styles.summaryLabel}>distance travel</Text>
      </View>
      
      <View style={styles.summaryItem}>
        <Text style={styles.summaryIcon}>🏆</Text>
        <Text style={styles.summaryValue}>{calories.toLocaleString()} Kcal</Text>
        <Text style={styles.summaryLabel}>calories burnt</Text>
      </View>
      
      <View style={styles.summaryItem}>
        <Text style={styles.summaryIcon}>🏅</Text>
        <Text style={styles.summaryValue}>{badges}</Text>
        <Text style={styles.summaryLabel}>Badges earned</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2C2C2E',
    marginHorizontal: 20,
    borderRadius: 15,
    marginTop: -30,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default SummaryStats; 