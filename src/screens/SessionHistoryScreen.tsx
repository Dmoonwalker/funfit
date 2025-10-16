/**
 * @fileoverview Session History Screen for FunFeet Cycling App
 * 
 * Displays a comprehensive list of all user cycling sessions with detailed metrics.
 * Features a clean card-based design with session data fetched from the database.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UltraSimpleSync } from '../services/UltraSimpleSync';
import { CyclingSession } from '../types/Session';


/**
 * SessionHistoryScreen Component
 * 
 * Displays all user cycling sessions in a clean, card-based layout
 * with detailed metrics for each session.
 */
const SessionHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUserId } = useAuth();
  const [sessions, setSessions] = useState<CyclingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch user sessions from database
   */
  const fetchSessions = useCallback(async () => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('📊 [SessionHistory] Fetching sessions for user:', currentUserId);
      const userSessions = await UltraSimpleSync.getUserSessions(currentUserId);
      
      if (userSessions && userSessions.length > 0) {
        console.log('📊 [SessionHistory] Found sessions:', userSessions.length);
        setSessions(userSessions);
      } else {
        console.log('📊 [SessionHistory] No sessions found');
        setSessions([]);
      }
    } catch (error) {
      console.error('📊 [SessionHistory] Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  /**
   * Format duration from milliseconds to HH:MM:SS
   */
  const formatDuration = (durationMs: number): string => {
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Format date for display
   */
  const formatDate = (timestamp: number | string): string => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  /**
   * Format time for display
   */
  const formatTime = (timestamp: number | string): string => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Load sessions on component mount
   */
  useEffect(() => {
    fetchSessions();
  }, [currentUserId, fetchSessions]);


  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigation.goBack();
  };

  // Sample daily history data (replace with real data)
  const dailyHistory = [
    { label: 'Mon', distanceKm: 2.5 },
    { label: 'Tue', distanceKm: 1.8 },
    { label: 'Wed', distanceKm: 0 },
    { label: 'Thur', distanceKm: 2.2 },
    { label: 'Fri', distanceKm: 0 },
    { label: 'Sat', distanceKm: 0 },
    { label: 'Sun', distanceKm: 0 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity style={styles.weekArrow}>
            <Text style={styles.weekArrowText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.weekTitle}>This week</Text>
          <TouchableOpacity style={styles.weekArrow}>
            <Text style={styles.weekArrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Days Exercised */}
        <View style={styles.daysExercised}>
          <Text style={styles.daysExercisedNumber}>3 of 7</Text>
          <Text style={styles.daysExercisedLabel}>days exercised</Text>
        </View>

        {/* Chart Container */}
        <View style={styles.chartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>100</Text>
            <Text style={styles.yAxisLabel}>80</Text>
            <Text style={styles.yAxisLabel}>60</Text>
            <Text style={styles.yAxisLabel}>40</Text>
            <Text style={styles.yAxisLabel}>20</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>
          
          {/* Chart area */}
          <View style={styles.chartArea}>
            <View style={styles.chartBars}>
              {dailyHistory.map((day, index) => {
                const maxDistance = Math.max(...dailyHistory.map(d => d.distanceKm), 5);
                const heightPercent = maxDistance > 0 ? (day.distanceKm / maxDistance) * 100 : 0;
                return (
                  <View key={index} style={styles.barWrapper}>
                    <View style={styles.barRemaining} />
                    <View style={[styles.bar, { height: `${heightPercent}%` }]} />
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLabels}>
              {dailyHistory.map((day, index) => (
                <Text key={index} style={styles.chartLabel}>
                  {day.label.charAt(0)}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Day Selector */}
        <View style={styles.daySelector}>
          {['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <TouchableOpacity 
              key={day} 
              style={[
                styles.dayButton,
                index === 1 && styles.dayButtonActive // Tue is active
              ]}
            >
              <Text style={[
                styles.dayButtonText,
                index === 1 && styles.dayButtonTextActive
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressFill65} />
        </View>

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <View style={styles.mainStatsLeft}>
            <Text style={styles.mainDistance}>20.30</Text>
            <Text style={styles.mainDistanceUnit}>Km</Text>
          </View>
          <View style={styles.mainStatsRight}>
            <Text style={styles.speedLabel}>Speed</Text>
            <Text style={styles.speedValue}>20.1 Km/h</Text>
          </View>
        </View>

        {/* Bottom Metrics */}
        <View style={styles.bottomMetrics}>
          <View style={styles.bottomMetricItem}>
            <Text style={styles.bottomMetricLabel}>Time</Text>
            <Text style={styles.bottomMetricValue}>00:00:00</Text>
          </View>
          <View style={styles.bottomMetricItem}>
            <Text style={styles.bottomMetricLabel}>Calories</Text>
            <Text style={styles.bottomMetricValue}>000 Kcal</Text>
          </View>
          <View style={styles.bottomMetricItem}>
            <Text style={styles.bottomMetricLabel}>Cycles</Text>
            <Text style={styles.bottomMetricValue}>200,000</Text>
          </View>
        </View>

        {/* Sessions Table */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#20A446" />
            <Text style={styles.loadingText}>Loading sessions...</Text>
          </View>
        ) : sessions.length > 0 ? (
          <View style={styles.sessionsTable}>
            <Text style={styles.sessionsTableTitle}>Recent Sessions</Text>
            {sessions.slice(0, 10).map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <View style={styles.sessionRowLeft}>
                  <Text style={styles.sessionRowDate}>{formatDate(session.startTime)}</Text>
                  <Text style={styles.sessionRowTime}>{formatTime(session.startTime)}</Text>
                </View>
                <View style={styles.sessionRowCenter}>
                  <Text style={styles.sessionRowDistance}>
                    {(session.totalDistance * 1000).toFixed(0)}m
                  </Text>
                  <Text style={styles.sessionRowDuration}>
                    {formatDuration(session.duration)}
                  </Text>
                </View>
                <View style={styles.sessionRowRight}>
                  <Text style={styles.sessionRowSpeed}>
                    {session.avgSpeed.toFixed(1)} km/h
                  </Text>
                  <Text style={styles.sessionRowCalories}>
                    {Math.round(session.totalCalories)} cal
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySessionsContainer}>
            <Text style={styles.emptySessionsText}>No sessions found</Text>
            <Text style={styles.emptySessionsSubtext}>Start cycling to see your sessions here</Text>
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
   * Main container
   */
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Header section
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  /**
   * Back button
   */
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
  },

  /**
   * Back button text
   */
  backButtonText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
  },

  /**
   * Header title
   */
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },

  /**
   * Header spacer for centering
   */
  headerSpacer: {
    width: 40,
  },

  /**
   * Week navigation
   */
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Week arrow
   */
  weekArrow: {
    padding: 8,
  },

  /**
   * Week arrow text
   */
  weekArrowText: {
    fontSize: 20,
    color: '#000000',
    fontWeight: 'bold',
  },

  /**
   * Week title
   */
  weekTitle: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
  },

  /**
   * Days exercised
   */
  daysExercised: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Days exercised number
   */
  daysExercisedNumber: {
    fontSize: 24,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    marginBottom: 4,
  },

  /**
   * Days exercised label
   */
  daysExercisedLabel: {
    fontSize: 14,
    color: '#666666',
  },

  /**
   * Chart container
   */
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Y-axis labels
   */
  yAxis: {
    justifyContent: 'space-between',
    height: 120,
    paddingRight: 8,
    alignItems: 'flex-end',
  },

  /**
   * Y-axis label
   */
  yAxisLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },

  /**
   * Chart area
   */
  chartArea: {
    flex: 1,
    alignItems: 'center',
  },

  /**
   * Chart bars
   */
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
    marginBottom: 10,
  },

  /**
   * Bar wrapper
   */
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },

  /**
   * Bar remaining
   */
  barRemaining: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },

  /**
   * Bar
   */
  bar: {
    backgroundColor: '#20A446',
    borderRadius: 4,
    minHeight: 4,
  },

  /**
   * Chart labels
   */
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },

  /**
   * Chart label
   */
  chartLabel: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
    textAlign: 'center',
  },

  /**
   * Day selector
   */
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Day button
   */
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },

  /**
   * Day button active
   */
  dayButtonActive: {
    backgroundColor: '#20A446',
  },

  /**
   * Day button text
   */
  dayButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },

  /**
   * Day button text active
   */
  dayButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /**
   * Progress bar
   */
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginHorizontal: 20,
    marginVertical: 16,
  },

  /**
   * Progress fill
   */
  progressFill: {
    height: '100%',
    backgroundColor: '#20A446',
    borderRadius: 2,
  },

  progressFill65: {
    height: '100%',
    backgroundColor: '#20A446',
    borderRadius: 2,
    width: '65%',
  },

  /**
   * Main stats
   */
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Main stats left
   */
  mainStatsLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  /**
   * Main distance
   */
  mainDistance: {
    fontSize: 36,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
  },

  /**
   * Main distance unit
   */
  mainDistanceUnit: {
    fontSize: 20,
    color: '#000000',
    marginLeft: 8,
  },

  /**
   * Main stats right
   */
  mainStatsRight: {
    alignItems: 'flex-end',
  },

  /**
   * Speed label
   */
  speedLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },

  /**
   * Speed value
   */
  speedValue: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
  },

  /**
   * Bottom metrics
   */
  bottomMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Bottom metric item
   */
  bottomMetricItem: {
    alignItems: 'center',
  },

  /**
   * Bottom metric label
   */
  bottomMetricLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },

  /**
   * Bottom metric value
   */
  bottomMetricValue: {
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
  },

  /**
   * Scroll view
   */
  scrollView: {
    flex: 1,
  },

  /**
   * Loading container
   */
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  /**
   * Loading text
   */
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },

  /**
   * Sessions table
   */
  sessionsTable: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },

  /**
   * Sessions table title
   */
  sessionsTableTitle: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    marginBottom: 16,
  },

  /**
   * Session row
   */
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  /**
   * Session row left
   */
  sessionRowLeft: {
    flex: 1,
  },

  /**
   * Session row date
   */
  sessionRowDate: {
    fontSize: 14,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    marginBottom: 2,
  },

  /**
   * Session row time
   */
  sessionRowTime: {
    fontSize: 12,
    color: '#666666',
  },

  /**
   * Session row center
   */
  sessionRowCenter: {
    flex: 1,
    alignItems: 'center',
  },

  /**
   * Session row distance
   */
  sessionRowDistance: {
    fontSize: 14,
    fontFamily: 'Lexend-Bold',
    color: '#20A446',
    marginBottom: 2,
  },

  /**
   * Session row duration
   */
  sessionRowDuration: {
    fontSize: 12,
    color: '#666666',
  },

  /**
   * Session row right
   */
  sessionRowRight: {
    flex: 1,
    alignItems: 'flex-end',
  },

  /**
   * Session row speed
   */
  sessionRowSpeed: {
    fontSize: 14,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    marginBottom: 2,
  },

  /**
   * Session row calories
   */
  sessionRowCalories: {
    fontSize: 12,
    color: '#666666',
  },

  /**
   * Empty sessions container
   */
  emptySessionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },

  /**
   * Empty sessions text
   */
  emptySessionsText: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },

  /**
   * Empty sessions subtext
   */
  emptySessionsSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default SessionHistoryScreen;
