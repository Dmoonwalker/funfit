import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

interface WeeklyData {
  day: string;
  target: number;
  actual: number;
}

interface WeeklyProgressProps {
  weeklyData: WeeklyData[];
}

const WeeklyProgress: React.FC<WeeklyProgressProps> = ({ weeklyData }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.chartYAxis}>
          <Text style={styles.chartLabel}>100</Text>
          <Text style={styles.chartLabel}>80</Text>
          <Text style={styles.chartLabel}>60</Text>
          <Text style={styles.chartLabel}>40</Text>
          <Text style={styles.chartLabel}>20</Text>
          <Text style={styles.chartLabel}>0</Text>
        </View>
        
        <View style={styles.chartBars}>
          {weeklyData.map((day, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.bar}>
                <View style={[styles.barSegment, { height: `${(day.actual / 100) * 120}` }]} />
              </View>
              <Text style={styles.barLabel}>{day.day}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 15,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
  },
  chartYAxis: {
    width: 30,
    height: 120,
    justifyContent: 'space-between',
    marginRight: 10,
  },
  chartLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    width: 20,
    height: 120,
    backgroundColor: '#3A3A3C',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barSegment: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#007AFF',
  },
  barLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default WeeklyProgress;
