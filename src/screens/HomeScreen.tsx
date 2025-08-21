/**
 * @fileoverview Home Screen Component for FunFeet Cycling App
 * 
 * This is the main screen of the application that displays:
 * - Real-time cycling animation with speed-responsive bike animation
 * - Progress tracking with distance, speed, time, calories, and cycles
 * - Leaderboard showing user rankings and achievements
 * - Achievement badges and progress levels
 * - Historical cycling data with charts
 * - KPI cards for key metrics
 * 
 * The screen integrates with BLE services for real-time data and
 * provides a comprehensive cycling experience dashboard.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { useBLE } from '../contexts/BLEContext';
import BikeAnimation from '../components/BikeAnimation';

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

/**
 * Props for the HomeScreen component
 */
interface HomeScreenProps {
  /** Navigation object for screen navigation */
  navigation: any;
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * HomeScreen Component
 * 
 * Main dashboard screen that displays cycling data, animations, and user progress.
 * Integrates with BLE services for real-time data and provides comprehensive
 * cycling metrics and achievements.
 * 
 * @param props - Component properties
 * @param props.navigation - Navigation object for screen transitions
 * 
 * @example
 * ```tsx
 * <HomeScreen navigation={navigation} />
 * ```
 */
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // ============================================================================
  // BLE CONTEXT INTEGRATION
  // ============================================================================

  /** BLE context for real-time cycling data and connection management */
  const { 
    isConnected, 
    currentSpeed 
  } = useBLE();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /** Local speed state for animation control and speed ramping */
  const [localSpeed, setLocalSpeed] = useState(0);
  
  /** Target speed for smooth speed transitions */
  const [targetSpeed, setTargetSpeed] = useState(0);
  
  /** Flag indicating if speed is currently ramping up */
  const [isSpeedRamping, setIsSpeedRamping] = useState(false);
  
  /** Gender selection for bike animation (male/female) */
  const [avatarGender, _setAvatarGender] = useState<'male' | 'female'>('male');
  
  /** Time filter for historical data display */
  const [_timeFilter, _setTimeFilter] = useState('All time');

  // ============================================================================
  // SAMPLE DATA
  // ============================================================================

  /**
   * Weekly cycling data for progress charts
   * Contains daily cycling metrics for the past week
   */
  const weeklyData = {
    monday: 58,
    tuesday: 44,
    wednesday: 70,
    thursday: 53,
    friday: 28,
    saturday: 18,
    sunday: 12,
  };

  /**
   * Leaderboard entries showing user rankings
   * Includes current user position and top performers
   */
  const leaderboardEntries = [
    { rank: 1, name: 'Mia T.', score: 300 },
    { rank: 2, name: 'Emma C.', score: 300 },
    { rank: 3, name: 'Liam T.', score: 300 },
    { rank: 28, name: 'You', score: 300, isCurrentUser: true },
  ];

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles Bluetooth icon press
   * Navigates to the BLE screen for device management
   */
  const handleBluetoothPress = () => {
    navigation.navigate('BLE');
  };



  /**
   * Handles speed increase button press
   * Implements smooth speed ramping for animation control
   * 
   * Speed ramping logic:
   * - If current speed is 0, start at 35 km/h
   * - Otherwise, increase current speed by 10 km/h
   * - Uses smooth animation to reach target speed
   */
  const handleSpeedUp = () => {
    setLocalSpeed(prev => {
      // If speed is 0, start at 35
      if (prev === 0) {
        const newTarget = 35;
        setTargetSpeed(newTarget);
        setIsSpeedRamping(true);
        return 35;
      }
      // Set target to current speed + 10
      const newTarget = prev + 10;
      setTargetSpeed(newTarget);
      setIsSpeedRamping(true);
      return prev;
    });
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Effect to handle linear speed ramping
   * Provides smooth speed transitions for animation
   * 
   * Increments speed by 1 km/h every 100ms until target is reached
   */
  useEffect(() => {
    if (!isSpeedRamping || localSpeed >= targetSpeed) {
      setIsSpeedRamping(false);
      return;
    }

    const interval = setInterval(() => {
      setLocalSpeed(prev => {
        if (prev >= targetSpeed) {
          setIsSpeedRamping(false);
          return prev;
        }
        return prev + 1;
      });
    }, 100); // Increment every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isSpeedRamping, localSpeed, targetSpeed]);

  /**
   * Effect to sync local speed with BLE current speed
   * Updates local speed when BLE data changes
   */
  useEffect(() => {
    if (isConnected && currentSpeed > 0) {
      setLocalSpeed(currentSpeed);
    }
  }, [isConnected, currentSpeed]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bike Animation Section */}
        <View style={styles.animationContainer}>
          <BikeAnimation
            speed={localSpeed}
            isConnected={isConnected}
            gender={avatarGender}
            onBluetoothPress={handleBluetoothPress}
          />
        </View>

        {/* Progress Bar Section */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarSection}>
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '65%' }]} />
              </View>
            </View>
            <View style={styles.mainMetricsRow}>
              <View style={styles.distanceSection}>
                <Text style={styles.distanceValue}>20.30</Text>
                <Text style={styles.distanceUnit}>Km</Text>
              </View>
              <View style={styles.speedSection}>
                <Text style={styles.speedLabel}>Speed</Text>
                <Text style={styles.speedValue}>20.1</Text>
                <Text style={styles.speedUnit}>Km/h</Text>
                {isConnected && (
                  <TouchableOpacity
                    style={styles.speedIncreaseButton}
                    onPress={handleSpeedUp}
                  >
                    <Text style={styles.speedIncreaseButtonText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.secondaryMetricsRow}>
              <View style={styles.secondaryMetric}>
                <Text style={styles.secondaryValue}>00:00:00</Text>
                <Text style={styles.secondaryLabel}>Time</Text>
              </View>
              <View style={styles.secondaryMetric}>
                <Text style={styles.secondaryValue}>000 Kcal</Text>
                <Text style={styles.secondaryLabel}>Calories</Text>
              </View>
              <View style={styles.secondaryMetric}>
                <Text style={styles.secondaryValue}>200,000</Text>
                <Text style={styles.secondaryLabel}>Cycles</Text>
              </View>
            </View>
          </View>
        </View>

        {/* KPI Cards Section */}
        <View style={styles.kpiContainer}>
          <Text style={styles.sectionTitle}>Distance Covered</Text>
          <View style={styles.kpiCards}>
            <View style={styles.kpiCard}>
              <Image
                source={require('../../assets/icons/distance.png')}
                style={styles.kpiIcon}
              />
              <View style={styles.kpiContent}>
                <Text style={styles.kpiValue}>20.30</Text>
                <Text style={styles.kpiLabel}>Total Distance</Text>
                <Text style={styles.kpiUnit}>Km</Text>
              </View>
            </View>
            <View style={styles.kpiCard}>
              <Image
                source={require('../../assets/icons/calories.png')}
                style={styles.kpiIcon}
              />
              <View style={styles.kpiContent}>
                <Text style={styles.kpiValue}>1,250</Text>
                <Text style={styles.kpiLabel}>Calories Burned</Text>
                <Text style={styles.kpiUnit}>Kcal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.leaderboardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.leaderboardContent}>
            {leaderboardEntries.map((entry, index) => (
              <View 
                key={index} 
                style={[
                  styles.leaderboardEntry,
                  entry.isCurrentUser && styles.currentUserEntry
                ]}
              >
                <Text style={[
                  styles.rankNumber,
                  entry.isCurrentUser && styles.currentUserRank
                ]}>
                  {entry.rank}
                </Text>
                <Text style={[
                  styles.entryName,
                  entry.isCurrentUser && styles.currentUserName
                ]}>
                  {entry.name}
                </Text>
                <Text style={[
                  styles.entryScore,
                  entry.isCurrentUser && styles.currentUserScore
                ]}>
                  {entry.score}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressLevelsContainer}>
            <View style={styles.progressLevel}>
              <View style={styles.progressIcon}>
                <Image
                  source={require('../../assets/icons/noob.png')}
                  style={styles.progressIconImage}
                />
              </View>
            </View>
            <View style={styles.progressLevel}>
              <View style={styles.progressIcon}>
                <Image
                  source={require('../../assets/icons/pro.png')}
                  style={styles.progressIconImage}
                />
              </View>
            </View>
            <View style={styles.progressLevel}>
              <View style={styles.progressIcon}>
                <Image
                  source={require('../../assets/icons/master.png')}
                  style={styles.progressIconImage}
                />
              </View>
            </View>
          </View>
        </View>

        {/* History Section */}
        <View style={styles.historyContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>History</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyGraph}>
            <View style={styles.graphBars}>
              <View style={styles.barWrapper}>
                <View style={styles.barRemaining} />
                <View style={[styles.bar, { height: `${weeklyData.monday}%` }]} />
              </View>
              <View style={styles.barWrapper}>
                <View style={styles.barRemaining} />
                <View style={[styles.bar, { height: `${weeklyData.tuesday}%` }]} />
              </View>
              <View style={styles.barWrapper}>
                <View style={styles.barRemaining} />
                <View style={[styles.bar, { height: `${weeklyData.wednesday}%` }]} />
              </View>
              <View style={styles.barWrapper}>
                <View style={styles.barRemaining} />
                <View style={[styles.bar, { height: `${weeklyData.thursday}%` }]} />
              </View>
              <View style={styles.barWrapper}>
                <View style={styles.barRemaining} />
                <View style={[styles.bar, { height: `${weeklyData.friday}%` }]} />
              </View>
              <View style={styles.barWrapper}>
                <View style={styles.barRemaining} />
                <View style={[styles.bar, { height: `${weeklyData.saturday}%` }]} />
              </View>
              <View style={styles.barWrapper}>
                <View style={styles.barRemaining} />
                <View style={[styles.bar, { height: `${weeklyData.sunday}%` }]} />
              </View>
            </View>
            <View style={styles.graphLabels}>
              <Text style={styles.graphLabel}>M</Text>
              <Text style={styles.graphLabel}>T</Text>
              <Text style={styles.graphLabel}>W</Text>
              <Text style={styles.graphLabel}>T</Text>
              <Text style={styles.graphLabel}>F</Text>
              <Text style={styles.graphLabel}>S</Text>
              <Text style={styles.graphLabel}>S</Text>
            </View>
          </View>
        </View>
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
   * Scroll content with padding
   */
  scrollContent: {
    paddingBottom: 20,
  },
  
  /**
   * Animation container with white background
   */
  animationContainer: {
    backgroundColor: '#FFFFFF',
  },
  
  /**
   * Progress bar section container
   * Light green background with shadow and rounded corners
   */
  progressBarContainer: {
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
   * Progress bar section content
   */
  progressBarSection: {
    gap: 15,
  },
  
  /**
   * Progress bar wrapper
   */
  progressBarWrapper: {
    height: 8,
    backgroundColor: '#D0E8D0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  /**
   * Progress bar background
   */
  progressBarBackground: {
    flex: 1,
    position: 'relative',
  },
  
  /**
   * Progress bar fill with green color
   */
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#20A446',
    borderRadius: 4,
  },
  
  /**
   * Main metrics row (distance and speed)
   */
  mainMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  /**
   * Distance section with large value display
   */
  distanceSection: {
    alignItems: 'center',
  },
  
  /**
   * Distance value text (large)
   */
  distanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
  },
  
  /**
   * Distance unit text
   */
  distanceUnit: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  
  /**
   * Speed section with speed increase button
   */
  speedSection: {
    alignItems: 'center',
    position: 'relative',
  },
  
  /**
   * Speed label text
   */
  speedLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  
  /**
   * Speed value text (large)
   */
  speedValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
  },
  
  /**
   * Speed unit text
   */
  speedUnit: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  
  /**
   * Speed increase button
   * Green circular button with plus sign
   */
  speedIncreaseButton: {
    position: 'absolute',
    right: -20,
    top: 10,
    width: 30,
    height: 30,
    backgroundColor: '#20A446',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  /**
   * Speed increase button text
   */
  speedIncreaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  /**
   * Secondary metrics row (time, calories, cycles)
   */
  secondaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  
  /**
   * Individual secondary metric
   */
  secondaryMetric: {
    alignItems: 'center',
  },
  
  /**
   * Secondary metric value text
   */
  secondaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  
  /**
   * Secondary metric label text
   */
  secondaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  
  /**
   * KPI cards container
   * Light green background with shadow and rounded corners
   */
  kpiContainer: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  
  /**
   * KPI cards row
   */
  kpiCards: {
    flexDirection: 'row',
    gap: 15,
  },
  
  /**
   * Individual KPI card
   * White background with shadow and rounded corners
   */
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  
  /**
   * KPI icon
   */
  kpiIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  
  /**
   * KPI content container
   */
  kpiContent: {
    flex: 1,
  },
  
  /**
   * KPI value text
   */
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  
  /**
   * KPI label text
   */
  kpiLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  
  /**
   * KPI unit text
   */
  kpiUnit: {
    fontSize: 12,
    color: '#666666',
  },
  
  /**
   * Leaderboard container
   * Light green background with shadow and rounded corners
   */
  leaderboardContainer: {
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
   * Section header with title and view all button
   */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  /**
   * View all button
   */
  viewAllButton: {
    backgroundColor: '#20A446',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  
  /**
   * View all button text
   */
  viewAllButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  /**
   * Leaderboard content
   */
  leaderboardContent: {
    gap: 8,
  },
  
  /**
   * Individual leaderboard entry
   */
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  /**
   * Current user entry styling
   */
  currentUserEntry: {
    backgroundColor: '#D0E8D0',
  },
  
  /**
   * Rank number text
   */
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#20A446',
    width: 30,
  },
  
  /**
   * Current user rank number
   */
  currentUserRank: {
    color: '#20A446',
  },
  
  /**
   * Entry name text
   */
  entryName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  
  /**
   * Current user name
   */
  currentUserName: {
    fontWeight: '600',
  },
  
  /**
   * Entry score text
   */
  entryScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#20A446',
  },
  
  /**
   * Current user score
   */
  currentUserScore: {
    color: '#20A446',
  },
  
  /**
   * Achievements container
   * Light green background with shadow and rounded corners
   */
  achievementsContainer: {
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
   * Progress levels container
   */
  progressLevelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  /**
   * Individual progress level
   */
  progressLevel: {
    alignItems: 'center',
  },
  
  /**
   * Progress icon container
   */
  progressIcon: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /**
   * Progress icon image
   */
  progressIconImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  
  /**
   * History container
   * Light green background with shadow and rounded corners
   */
  historyContainer: {
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
   * History graph container
   */
  historyGraph: {
    alignItems: 'center',
  },
  
  /**
   * Graph bars container
   */
  graphBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 8,
    marginBottom: 10,
  },
  
  /**
   * Individual bar wrapper
   */
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  
  /**
   * Bar remaining space (light green)
   */
  barRemaining: {
    flex: 1,
    backgroundColor: '#D0E8D0',
    borderRadius: 4,
  },
  
  /**
   * Bar fill (green)
   */
  bar: {
    backgroundColor: '#20A446',
    borderRadius: 4,
    minHeight: 4,
  },
  
  /**
   * Graph labels container
   */
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  
  /**
   * Graph label text
   */
  graphLabel: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
    textAlign: 'center',
  },
});

export default HomeScreen; 