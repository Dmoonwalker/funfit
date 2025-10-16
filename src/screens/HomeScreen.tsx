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
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBLE } from '../contexts/BLEContext';
import { useAuth } from '../contexts/AuthContext';
import BikeAnimation from '../components/BikeAnimation';
import SimpleLeaderboard from '../components/SimpleLeaderboard';
import BadgesSection from '../components/BadgesSection';

import { UltraSimpleSync } from '../services/UltraSimpleSync';
import { AuthService } from '../services/AuthService';
import { LeaderboardService } from '../services/LeaderboardService';

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
  // SAFE AREA AND CONTEXT HOOKS
  // ============================================================================
  
  /** Safe area insets to avoid system UI */
  const insets = useSafeAreaInsets();

  /** BLE context for real-time cycling data and connection management */
  const { 
    isConnected, 
    currentSpeed,
    currentDistance,
    currentCycles,
    currentCalories,
    completedSessions,
    fetchCompletedSessions,
    startSession,
    stopSession,
    cleanupForLogout,
    resetSessionData,
    resetTrigger,
  } = useBLE();

  /** Authentication context for user management */
  const {
    currentUserId: authUserId,
    userProfile,
    signOut,
  } = useAuth();

  /** Screen dimensions for responsive text sizing */
  const screenDimensions = Dimensions.get('window');
  const isLandscape = screenDimensions.width > screenDimensions.height;
  const isSmallScreen = screenDimensions.width < 600 || screenDimensions.height < 400;
  
  // Responsive font sizes for portrait mode
  const portraitFontSizes = {
    distanceValue: isSmallScreen ? 28 : 32, // was 40
    distanceUnit: isSmallScreen ? 16 : 18,  // was 22
    speedValue: isSmallScreen ? 18 : 20,    // was 24
    speedLabel: isSmallScreen ? 12 : 14,    // was 14
    metricValue: isSmallScreen ? 14 : 16,   // was 16
    metricLabel: isSmallScreen ? 12 : 14,   // was 14
    cardTitle: isSmallScreen ? 16 : 18,     // was 18
    kpiValue: isSmallScreen ? 14 : 16,      // was 16
    kpiLabel: isSmallScreen ? 10 : 12,      // was 12
    viewAll: isSmallScreen ? 12 : 14,       // was 14
    badgeTitle: isSmallScreen ? 10 : 12,    // was 12
    chartLabel: isSmallScreen ? 10 : 12,    // was 12
    legendText: isSmallScreen ? 10 : 12,    // was 12
  };

  // ============================================================================
  // STORED DATA STATE
  // ============================================================================

  /** Current user ID (from auth context) */
  const currentUserId = authUserId;
  
  /** Loading states */

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /** Local speed state for animation control - now controlled by BLE */
  const [localSpeed, setLocalSpeed] = useState(0);
  
  /** Target speed for smooth speed transitions */
  const [_targetSpeed, _setTargetSpeed] = useState(0);
  
  /** Flag indicating if speed is currently ramping up */
  const [isSpeedRamping, setIsSpeedRamping] = useState(false);
  
  /** Gender selection for bike animation (male/female) */
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>(userProfile?.avatar_gender || 'male');
  
  /** Time filter for historical data display */
  const [_timeFilter, _setTimeFilter] = useState('All time');
  
  /** Timer for session elapsed time */
  const [elapsedMs, setElapsedMs] = useState(0);
  
  /** Screen dimensions and orientation state */
  const [screenDimensionsState, setScreenDimensions] = useState(Dimensions.get('window'));
  const isLandscapeState = screenDimensionsState.width > screenDimensionsState.height;

  /** User stats for portrait highscore display */
  const [userStats, setUserStats] = useState<{distance: number, calories: number, badges: number} | null>(null);

  /** Menu dropdown state */
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  /** User's daily goal from profile */
  const [userDailyGoalKm, setUserDailyGoalKm] = useState(2); // Default 2km

  // Achievement badges now handled by BadgesSection component
  
  /** Session goal distance in km (from user's daily goal) */
  const sessionGoalKm = React.useMemo(() => {
    return userDailyGoalKm;
  }, [userDailyGoalKm]);

  // ============================================================================
  // SAMPLE DATA
  // ============================================================================

  /**
   * Calculate weekly data from recent sessions
   */

  // Prepare daily history for past 7 days (today inclusive)
  const dailyHistory = React.useMemo(() => {
    const days: { label: string; distanceKm: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayKey = d.toDateString();
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const distanceKm = completedSessions
        .filter(s => new Date(s.startTime).toDateString() === dayKey)
        .reduce((sum, s) => sum + (s.totalDistance || 0), 0);
      days.push({ label: dayLabel, distanceKm });
    }
    return days;
  }, [completedSessions]);

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
   * Handles menu toggle
   */
  const handleMenuPress = () => {
    setIsMenuVisible(!isMenuVisible);
  };


  /**
   * Handle logout with BLE cleanup
   */
  const handleLogout = async () => {
    try {
      console.log('🔐 Starting logout process with BLE cleanup...');
      
      // First, cleanup BLE connections and save any active session
      await cleanupForLogout();
      console.log('✅ BLE cleanup completed');
      
      // Then sign out from authentication
      await signOut();
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still try to sign out even if BLE cleanup fails
      await signOut();
    }
  };

  /**
   * Handles menu option selection
   */
  const handleMenuOption = (option: 'settings' | 'profile' | 'reset' | 'logout') => {
    setIsMenuVisible(false);
    
    switch (option) {
      case 'settings':
        // TODO: Navigate to settings screen
        console.log('Navigate to Settings');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      case 'reset':
        handleResetSession();
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  /**
   * Handles session reset
   */
  const handleResetSession = () => {
    Alert.alert(
      'Reset Session Data',
      'Are you sure you want to reset all session data? This will clear distance, calories, cycles, and speed data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetSessionData();
            console.log('🔄 Session data reset by user');
          },
        },
      ]
    );
  };


  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Effect to handle screen orientation changes
   * Updates screen dimensions when device orientation changes
   */
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  /**
   * Update localSpeed from BLE - exactly like your original slider
   */
  useEffect(() => {
    if (isConnected && currentSpeed !== undefined) {
      setLocalSpeed(currentSpeed);  // Update like slider onValueChange
      console.log("🎯 HomeScreen: Setting localSpeed from BLE:", currentSpeed);
    } else {
      setLocalSpeed(0);  // 0 when disconnected
      console.log("🎯 HomeScreen: Setting localSpeed to 0 (disconnected)");
    }
  }, [isConnected, currentSpeed]);

  /**
   * Set default avatar gender
   */
  useEffect(() => {
    // Default to male avatar for now
    // TODO: Could store user preference locally later
    setAvatarGender('male');
  }, []);


  /**
   * Effect to handle linear speed ramping (keep original logic)
   */
  useEffect(() => {
    if (!isSpeedRamping || localSpeed >= _targetSpeed) {
      setIsSpeedRamping(false);
      return;
    }

    const interval = setInterval(() => {
      setLocalSpeed(prev => {
        if (prev >= _targetSpeed) {
          setIsSpeedRamping(false);
          return prev;
        }
        return prev + 1;
      });
    }, 100); // Increment every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isSpeedRamping, localSpeed, _targetSpeed]);

  /**
   * Effect to sync local speed with BLE current speed
   * Updates local speed when BLE data changes
   */
  useEffect(() => {
    if (isConnected && currentSpeed > 0) {
      setLocalSpeed(currentSpeed);
    }
  }, [isConnected, currentSpeed]);

  /**
   * Effect to handle session timer - only counts when speed > 0.00
   */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isConnected) {
      interval = setInterval(() => {
        // Only increment timer if speed is greater than 0.00
        if (currentSpeed > 0.00) {
          setElapsedMs((prev) => prev + 1000);
          console.log('⏱️ Timer counting - Speed:', currentSpeed, 'km/h');
        } else {
          console.log('⏸️ Timer paused - Speed:', currentSpeed, 'km/h');
        }
      }, 1000);
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, currentSpeed]);

  /**
   * Effect to reset timer when session is reset
   */
  useEffect(() => {
    if (resetTrigger > 0) {
      setElapsedMs(0);
      console.log('⏱️ Timer reset due to session reset');
    }
  }, [resetTrigger]);

  /**
   * Effect to fetch user stats for portrait highscore display
   */
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUserId) return;
      
      try {
        const stats = await LeaderboardService.getUserStats(currentUserId);
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to fetch user stats for portrait highscore:', error);
        setUserStats({ distance: 0, calories: 0, badges: 0 });
      }
    };
    
    fetchUserStats();
  }, [currentUserId]);

  /**
   * Effect to initialize user data when auth state changes
   */
  useEffect(() => {
    if (currentUserId) {
      initializeUserData();
      fetchUserDailyGoal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]); // Run when auth state changes

  /**
   * Update avatar gender when user profile changes
   */
  useEffect(() => {
    if (userProfile?.avatar_gender) {
      console.log('🎭 [HomeScreen] Updating avatar gender from profile:', userProfile.avatar_gender);
      setAvatarGender(userProfile.avatar_gender);
    }
  }, [userProfile?.avatar_gender]);

  /**
   * Fetch user's daily goal from profile
   */
  const fetchUserDailyGoal = async () => {
    if (!currentUserId) return;
    
    try {
      const currentUserProfile = await AuthService.getUserProfile(currentUserId);
      let dailyGoalKm = 5; // Default value
      
      if (currentUserProfile?.daily_goal_km) {
        // Use km value directly if available
        dailyGoalKm = currentUserProfile.daily_goal_km;
        console.log('📊 [HomeScreen] User daily goal loaded from km:', dailyGoalKm, 'km');
      } else if (currentUserProfile?.daily_goal_calories) {
        // Fallback: Convert calories to km (40 calories per km)
        dailyGoalKm = currentUserProfile.daily_goal_calories / 40;
        console.log('📊 [HomeScreen] User daily goal loaded from calories:', dailyGoalKm, 'km');
      } else {
        console.log('📊 [HomeScreen] No daily goal found, using default:', dailyGoalKm, 'km');
      }
      
      setUserDailyGoalKm(dailyGoalKm);
    } catch (error) {
      console.error('❌ [HomeScreen] Failed to fetch user daily goal:', error);
    }
  };

  // ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================

  /**
   * Initialize user data on app startup
   */
  const initializeUserData = async () => {
    try {
      
      // Test logging first
      UltraSimpleSync.testLogging();
      
      // Test database connection
      console.log('📱 [HomeScreen] Testing database connection...');
      const dbTestResult = await UltraSimpleSync.testDatabaseConnection();
      console.log('📱 [HomeScreen] Database test result:', dbTestResult);
      
      // User ID is now managed by AuthContext
      console.log('📱 [HomeScreen] Using auth user ID:', currentUserId);
      
      // Fetch completed sessions from cloud
      if (currentUserId) {
        await fetchCompletedSessions(currentUserId);
      } else {
        console.warn('📱 [HomeScreen] No currentUserId available for session fetch');
      }
      
    } catch (error) {
      console.error('❌ [HomeScreen] Failed to initialize user data:', error);
    }
  };


  /**
   * Load user statistics and recent sessions
   */
  const loadUserData = React.useCallback(async () => {
    if (!currentUserId) {
      console.log('🔍 LoadUserData: No currentUserId');
      return;
    }
    
    console.log('🔍 LoadUserData: Starting for user:', currentUserId);
    console.log('📊 Sessions from cloud:', completedSessions.length);
  }, [currentUserId, completedSessions.length]);


  /**
   * Effect to refresh data when user reconnects or sessions change
   */
  useEffect(() => {
    if (currentUserId) {
      loadUserData();
    }
  }, [currentUserId, isConnected, loadUserData]);

  useEffect(() => {
    const manageSession = async () => {
      if (!currentUserId || currentUserId.startsWith('guest_')) {
        return;
      }

      try {
        if (isConnected) {
          console.log('SESSION [HOMESCREEN] Starting session for user:', currentUserId);
          await startSession(currentUserId);
        } else {
          console.log('SESSION [HOMESCREEN] Stopping session');
          await stopSession();
        }
      } catch (error) {
        console.error('SESSION [HOMESCREEN] Session management failed:', error);
      }
    };

    manageSession();
  }, [isConnected, currentUserId, startSession, stopSession]);


  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={[styles.container, { 
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]} edges={[]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="white" 
        translucent={false}
      />
      <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
        {isLandscape ? (
          // Landscape mode: Scrollable content with full screen animation
        <ScrollView 
            style={styles.landscapeScrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.landscapeScrollContent}
            bounces={true}
            alwaysBounceVertical={true}
          >
            <View style={styles.landscapeContainer}>
          <BikeAnimation
            speed={localSpeed}
            isConnected={isConnected}
            gender={avatarGender}
            onBluetoothPress={handleBluetoothPress}
            onMenuPress={handleMenuPress}
            sessionGoalKm={sessionGoalKm}
          />
          
              {/* Landscape Mode Content - Leaderboard, History, Achievements */}
              <View style={styles.landscapeAdditionalContent}>
                {/* Leaderboard and History Row */}
                <View style={[
                  styles.landscapeRow,
                  isSmallScreen && styles.landscapeRowSmall
                ]}>
                  {/* Leaderboard */}
                  <View style={styles.landscapeColumn}>
                    <Text style={[
                      styles.landscapeSectionTitle,
                      isSmallScreen && styles.landscapeSectionTitleSmall
                    ]}>Leaderboard</Text>
                    <SimpleLeaderboard />
                  </View>
                  
                  {/* History */}
                  <View style={styles.landscapeColumn}>
                    <View style={styles.historyHeader}>
                      <Text style={[
                        styles.landscapeSectionTitle,
                        isSmallScreen && styles.landscapeSectionTitleSmall
                      ]}>History</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('SessionHistory' as never)}
              >
                <Text style={styles.viewAllButtonText}>View all &gt;</Text>
              </TouchableOpacity>
                </View>
                <View style={styles.historyGraph}>
                  <View style={styles.graphBars}>
                    {dailyHistory.map((day, index) => {
                      const maxDistance = Math.max(...dailyHistory.map(d => d.distanceKm), 2);
                      const heightPercent = maxDistance > 0 ? (day.distanceKm / maxDistance) * 100 : 0;
                      return (
                        <View key={index} style={styles.barWrapper}>
                          <View style={styles.barRemaining} />
                          <View style={[styles.bar, { height: `${heightPercent}%` }]} />
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.graphLabels}>
                    {dailyHistory.map((day, index) => (
                      <Text key={index} style={styles.graphLabel}>
                        {day.label.split(' ')[0]}
                      </Text>
                    ))}
                      </View>
                  </View>
                </View>
              </View>
              
                {/* Achievements Section */}
                <View style={styles.landscapeSection}>
                  <BadgesSection navigation={navigation} />
                </View>
              
                {/* Bottom padding for landscape mode */}
                <View style={styles.landscapeBottomPadding} />
              </View>
            </View>
          </ScrollView>
        ) : (
          // Portrait mode: Clean card-based layout
          <ScrollView 
            style={styles.portraitScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.portraitScrollContent}
          >
            {/* Bike Animation Section */}
            <View style={styles.animationContainer}>
              <BikeAnimation
                speed={localSpeed}
                isConnected={isConnected}
                gender={avatarGender}
                onBluetoothPress={handleBluetoothPress}
                onMenuPress={handleMenuPress}
                sessionGoalKm={sessionGoalKm}
              />
          
            </View>

            {/* Top Metrics Section - Current Session Data */}
            <View style={[styles.portraitCard, styles.portraitFirstCard]}>
              {/* Progress Bar */}
              <View style={styles.portraitProgressBar}>
                  <View style={[
                  styles.portraitProgressFill, 
                    { width: `${Math.min((currentDistance / sessionGoalKm) * 100, 100)}%` }
                  ]} />
                </View>
              
              {/* Main Distance and Speed */}
              <View style={styles.portraitMainMetrics}>
                <View style={styles.portraitDistanceSection}>
                  <Text style={[styles.portraitDistanceValue, { fontSize: portraitFontSizes.distanceValue }]}>
                      {isConnected ? (currentDistance).toFixed(2) : '0.00'}
                    </Text>
                  <Text style={[styles.portraitDistanceUnit, { fontSize: portraitFontSizes.distanceUnit }]}>Km</Text>
                  </View>
                <View style={styles.portraitSpeedSection}>
                  <Text style={[styles.portraitSpeedLabel, { fontSize: portraitFontSizes.speedLabel }]}>Speed</Text>
                  <Text style={[styles.portraitSpeedValue, { fontSize: portraitFontSizes.speedValue }]}>
                    {isConnected ? currentSpeed.toFixed(1) : localSpeed.toFixed(1)} Km/h
                    </Text>
                  </View>
                </View>
              
              {/* Bottom Metrics Row */}
              <View style={styles.portraitBottomMetrics}>
                <View style={styles.portraitMetricItem}>
                  <Text style={[styles.portraitMetricLabel, { fontSize: portraitFontSizes.metricLabel }]}>Time</Text>
                  <Text style={[styles.portraitMetricValue, { fontSize: portraitFontSizes.metricValue }]}>
                    {(() => {
                      const totalSeconds = Math.floor(elapsedMs / 1000);
                      const hours = Math.floor(totalSeconds / 3600);
                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                      const seconds = totalSeconds % 60;
                      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    })()}
                  </Text>
                </View>
                <View style={styles.portraitMetricItem}>
                  <Text style={[styles.portraitMetricLabel, { fontSize: portraitFontSizes.metricLabel }]}>Calories</Text>
                  <Text style={[styles.portraitMetricValue, { fontSize: portraitFontSizes.metricValue }]}>
                    {isConnected ? `${currentCalories.toFixed(0)} Kcal` : '000 Kcal'}
                  </Text>
                </View>
                <View style={styles.portraitMetricItem}>
                  <Text style={[styles.portraitMetricLabel, { fontSize: portraitFontSizes.metricLabel }]}>Cycles</Text>
                  <Text style={[styles.portraitMetricValue, { fontSize: portraitFontSizes.metricValue }]}>
                    {isConnected ? currentCycles.toLocaleString() : '200,000'}
                  </Text>
              </View>
            </View>
          </View>

            {/* Highscore Section */}
            <View style={styles.portraitCard}>
              <Text style={styles.portraitCardTitle}>Highscore</Text>
              <View style={styles.portraitKpiRow}>
                <View style={styles.portraitKpiItem}>
                  <Image source={require('../../assets/icons/distance.png')} style={
                    isSmallScreen ? styles.portraitKpiIconSmall : styles.portraitKpiIconLarge
                  } />
                  <Text style={styles.portraitKpiValue}>{userStats ? `${userStats.distance.toFixed(1)} KM` : '0.0 KM'}</Text>
                  <Text style={styles.portraitKpiLabel}>distance travel</Text>
                </View>
                <View style={styles.portraitKpiItem}>
                  <Image source={require('../../assets/icons/calories.png')} style={
                    isSmallScreen ? styles.portraitKpiIconSmall : styles.portraitKpiIconLarge
                  } />
                  <Text style={styles.portraitKpiValue}>{userStats ? `${userStats.calories.toLocaleString()} Kcal` : '0 Kcal'}</Text>
                  <Text style={styles.portraitKpiLabel}>calories burnt</Text>
            </View>
                <View style={styles.portraitKpiItem}>
                  <Image source={require('../../assets/icons/badges.png')} style={
                    isSmallScreen ? styles.portraitKpiIconSmall : styles.portraitKpiIconLarge
                  } />
                  <Text style={styles.portraitKpiValue}>{userStats ? userStats.badges : 0}</Text>
                  <Text style={styles.portraitKpiLabel}>Badges earned</Text>
                </View>
                </View>
              </View>
              
            {/* Leaderboard Section */}
            <View style={styles.portraitCard}>
              <Text style={styles.portraitCardTitle}>Leaderboard</Text>
              <SimpleLeaderboard />
            </View>

            {/* Achievements Section */}
            <BadgesSection navigation={navigation} />

            {/* History Section */}
            <View style={styles.portraitCard}>
              <View style={styles.portraitCardHeader}>
                <Text style={styles.portraitCardTitle}>History</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SessionHistory' as never)}>
                  <Text style={styles.portraitViewAll}>View all &gt;</Text>
              </TouchableOpacity>
            </View>
              <View style={styles.portraitHistoryChart}>
                {/* Y-axis labels */}
                <View style={styles.portraitYAxis}>
                  <Text style={styles.portraitYAxisLabel}>5</Text>
                  <Text style={styles.portraitYAxisLabel}>4</Text>
                  <Text style={styles.portraitYAxisLabel}>3</Text>
                  <Text style={styles.portraitYAxisLabel}>2</Text>
                  <Text style={styles.portraitYAxisLabel}>1</Text>
                  <Text style={styles.portraitYAxisLabel}>0</Text>
          </View>
                
                {/* Chart area */}
                <View style={styles.portraitChartArea}>
                  <View style={styles.portraitChartBars}>
                    {dailyHistory.map((day, index) => {
                      const maxDistance = Math.max(...dailyHistory.map(d => d.distanceKm), 2);
                      const heightPercent = maxDistance > 0 ? (day.distanceKm / maxDistance) * 100 : 0;
                      return (
                        <View key={index} style={styles.portraitBarWrapper}>
                          <View style={styles.portraitBarRemaining} />
                          <View style={[styles.portraitBar, { height: `${heightPercent}%` }]} />
            </View>
                      );
                    })}
            </View>
                  <View style={styles.portraitChartLabels}>
                    {dailyHistory.map((day, index) => (
                      <Text key={index} style={styles.portraitChartLabel}>
                        {day.label.split(' ')[0]}
                    </Text>
                    ))}
                  </View>
                  </View>
                  </View>
              
              {/* Legend - moved below the chart */}
              <View style={styles.portraitChartLegend}>
                <View style={styles.portraitLegendItem}>
                  <View style={styles.portraitLegendColor} />
                  <Text style={styles.portraitLegendText}>Daily Distance (km)</Text>
                </View>
            </View>
        </View>
        
        </ScrollView>
        )}
      </TouchableWithoutFeedback>
      
      {/* Background Overlay for closing dropdown */}
      {isMenuVisible && (
        <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
          <View style={styles.menuOverlay} />
        </TouchableWithoutFeedback>
      )}
      
      {/* Dropdown Menu - Outside TouchableWithoutFeedback for clickability */}
      {isMenuVisible && (
        <View style={[
          styles.menuDropdown,
          isLandscapeState ? styles.menuDropdownLandscape : styles.menuDropdownPortrait
        ]}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuOption('settings')}
          >
            <Image source={require('../../assets/images/settings.png')} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuOption('profile')}
          >
            <Image source={require('../../assets/images/profile.png')} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuOption('reset')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FF6B35', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>↻</Text>
            </View>
            <Text style={[styles.menuItemText, { color: '#FF6B35' }]}>Reset Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuOption('logout')}
          >
            <Image source={require('../../assets/images/logout.png')} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingTop: 20
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
    width: '100%',
  },

  /**
   * Landscape scroll view - allows scrolling in landscape mode
   */
  landscapeScrollView: {
    flex: 1,
  },

  /**
   * Landscape scroll content - ensures content can scroll
   */
  landscapeScrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },

  /**
   * Landscape container for full screen animation
   */
  landscapeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    minHeight: Dimensions.get('window').height,
  },

  /**
   * Additional content container for landscape scrolling
   */
  landscapeAdditionalContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  /**
   * Landscape metrics section
   */
  landscapeMetricsSection: {
    marginBottom: 20,
  },

  /**
   * Landscape leaderboard section
   */
  landscapeLeaderboardSection: {
    marginBottom: 20,
  },

  /**
   * Extra space at bottom to ensure scrolling works
   */
  landscapeExtraSpace: {
    height: 100, // Extra space for scrolling
  },

  /**
   * Middle section: Achievements
   */
  achievementsSection: {
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
   * Achievements grid container
   */
  achievementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 15,
    flexWrap: 'wrap',

    gap: 10,
  },

  /**
   * Individual achievement badge
   */
  achievementBadge: {
    alignItems: 'center',
    width: 80,
    marginHorizontal: 5,
  },

  /**
   * Badge icon
   */
  badgeIcon: {
    width: 100,
    height: 100,
    marginBottom: 0,
    resizeMode: 'contain'
  },

  /**
   * Badge icon - small screen
   */
  badgeIconSmall: {
    width: 60,
    height: 60,
  },

  /**
   * Badge title
   */
  badgeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#20A446',
    textAlign: 'center',
    marginTop: 8,
  },

  /**
   * Badge subtitle
   */
  badgeSubtitle: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },

  /**
   * Bottom section with two columns
   */
  bottomSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 10,
    gap: 10,
  },

  /**
   * Left column: Leaderboard
   */
  leaderboardColumn: {
    flex: 1,
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  /**
   * Right column: History
   */
  historyColumn: {
    flex: 1,
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  /**
   * Column title
   */
  columnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },

  /**
   * Native animation view
   */
  nativeAnimation: {
    width: '100%',
    height: '100%',
  },

  /**
   * Bluetooth icon container
   */
  bluetoothIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: '#20A446',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  /**
   * Bluetooth icon image
   */
  bluetoothIconImage: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },

  /**
   * Speed slider container
   * Light green background with shadow and rounded corners
   */
  speedSliderContainer: {
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
   * Speed slider header with title and current value
   */
  speedSliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  /**
   * Speed slider title
   */
  speedSliderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },

  /**
   * Speed slider current value
   */
  speedSliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#20A446',
  },

  /**
   * Speed slider wrapper with labels
   */
  speedSliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  /**
   * Speed slider labels (0 and 50)
   */
  speedSliderLabel: {
    fontSize: 14,
    color: '#666666',
    width: 30,
    textAlign: 'center',
  },

  /**
   * Speed slider component
   */
  speedSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },


  /**
   * Speed slider description
   */
  speedSliderDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
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
   * Progress bar goal text
   */
  progressBarGoalText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
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
   * Top metrics row (Distance and Speed side by side)
   */
  topMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 25,
  },

  /**
   * Top metric section
   */
  topMetricSection: {
    alignItems: 'flex-start',
  },

  /**
   * Top value row (value + unit side by side)
   */
  topValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  /**
   * Top metric value (large numbers like 20.30, 20.1)
   */
  topMetricValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 50,
  },

  /**
   * Top metric unit (Km, Km/h)
   */
  topMetricUnit: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '500',
    marginLeft: 8,
  },

  /**
   * Top metric label (Speed)
   */
  topMetricLabel: {
    fontSize: 14,
    color: '#000000',
    marginTop: 4,
    textAlign: 'right',
  },

  /**
   * Bottom metrics row (Time, Calories, Cycles)
   */
  bottomMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },

  /**
   * Bottom metric section
   */
  bottomMetricSection: {
    alignItems: 'center',
    flex: 1,
  },

  /**
   * Bottom metric label (Time, Calories, Cycles)
   */
  bottomMetricLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 6,
    fontWeight: '500',
  },

  /**
   * Bottom metric value (00:00:00, 000 Kcal, 200,000)
   */
  bottomMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },

  /**
   * Additional stats row below KPI cards
   */
  additionalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },

  /**
   * Individual stat item in additional stats
   */
  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  /**
   * Stat value text
   */
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },

  /**
   * Stat label text
   */
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },

  /**
   * Recent sessions container
   */
  recentSessionsContainer: {
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
   * Sessions content container
   */
  sessionsContent: {
    gap: 12,
  },

  /**
   * Individual session entry
   */
  sessionEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  /**
   * Session info (date and duration)
   */
  sessionInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },

  /**
   * Session date text
   */
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },

  /**
   * Session duration text
   */
  sessionDuration: {
    fontSize: 12,
    color: '#666666',
  },

  /**
   * Session stats (distance and speed)
   */
  sessionStats: {
    flex: 1,
    alignItems: 'center',
  },

  /**
   * Session distance text
   */
  sessionDistance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#20A446',
    marginBottom: 2,
  },

  /**
   * Session speed text
   */
  sessionSpeed: {
    fontSize: 12,
    color: '#666666',
  },

  /**
   * Session time text
   */
  sessionTime: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
  },

  /**
   * Session calories text
   */
  sessionCalories: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },

  /**
   * Session badge (cycles)
   */
  sessionBadge: {
    alignItems: 'flex-end',
    minWidth: 60,
  },

  /**
   * Session cycles count
   */
  sessionCycles: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },

  /**
   * Session cycles label
   */
  sessionCyclesLabel: {
    fontSize: 10,
    color: '#666666',
    textTransform: 'uppercase',
  },

  /**
   * Loading container
   */
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },

  /**
   * Loading text
   */
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },

  /**
   * Empty state container
   */
  emptyStateContainer: {
    padding: 30,
    alignItems: 'center',
  },

  /**
   * Empty state text
   */
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },

  /**
   * Empty state subtext
   */
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  /**
   * Refresh button
   */
  refreshButton: {
    backgroundColor: '#20A446',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },

  /**
   * Refresh button text
   */
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  /**
   * Debug container
   */
  debugContainer: {
    backgroundColor: '#FFE6E6',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },

  /**
   * Debug text
   */
  debugText: {
    fontSize: 12,
    color: '#8B0000',
    marginBottom: 2,
    fontFamily: 'monospace',
  },

  /**
   * Auth actions container
   */
  authActions: {
    marginTop: 10,
    alignItems: 'center',
  },

  /**
   * Auth button
   */
  authButton: {
    backgroundColor: '#20A446',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  /**
   * Auth button text
   */
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
   * Section header with title and view all button
   */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  /**
   * View all container
   */
  viewAllContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  
  /**
   * View all button
   */
  viewAllButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1000,
  },
  
  /**
   * View all button text
   */
  viewAllButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
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

  /**
   * Live data indicator container
   */
  liveDataIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#20A446',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  /**
   * Live data indicator dot
   */
  liveDataDot: {
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    marginRight: 4,
  },

  /**
   * Live data indicator text
   */
  liveDataText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  /**
   * Dropdown menu container
   */
  menuDropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10000, // Very high z-index
  },
  menuDropdownPortrait: {
    top: 80,
    right: 60, // Added padding to keep 3 dots visible
    maxWidth: 200,
  },
  menuDropdownLandscape: {
    top: 60,
    right: 60, // Added padding to keep 3 dots visible
    maxWidth: 180,
  },

  /**
   * Background overlay for closing dropdown
   */
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // Just below the dropdown menu
  },

  /**
   * Individual menu item
   */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },

  /**
   * Menu icon
   */
  menuIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#333333',
  },

  /**
   * Menu item text
   */
  menuItemText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },

  /**
   * Achievements scroll view
   */
  achievementsScroll: {
    marginTop: 15,
    height: 140,
  },

  /**
   * Achievements row
   */
  achievementsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 10,
  },

  /**
   * Landscape section - clean without shadows
   */
  landscapeSection: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  /**
   * Landscape section title
   */
  landscapeSectionTitle: {
    fontSize: 23,
    fontFamily: 'Lexend-Bold',
    color: 'black',
    marginBottom: 15,
  },

  /**
   * Landscape section title - small screen
   */
  landscapeSectionTitleSmall: {
    fontSize: 18,
    marginBottom: 10,
  },

  /**
   * Landscape section - small screen
   */
  landscapeSectionSmall: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },

  /**
   * Landscape row for side-by-side content
   */
  landscapeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 30,
  },

  /**
   * Landscape row - small screen
   */
  landscapeRowSmall: {
    paddingHorizontal: 12,
    gap: 15,
  },

  /**
   * Landscape column - clean without shadows
   */
  landscapeColumn: {
    flex: 1,
  },

  /**
   * Full width achievements container
   */
  achievementsFullWidth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /**
   * Achievements scroll container
   */
  achievementsScrollContainer: {
    paddingHorizontal: 4,
  },

  /**
   * Full width achievements container
   */
  achievementsFullWidthContainer: {
    width: '100%',
  },

  /**
   * Full width achievements scroll
   */
  achievementsFullWidthScroll: {
    paddingHorizontal: 0,
  },

  /**
   * Achievements landscape container - centered and scrollable
   */
  achievementsLandscapeContainer: {
    width: '100%',
  },

  /**
   * Achievements landscape scroll - proper spacing for landscape
   */
  achievementsLandscapeScroll: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },

  /**
   * Achievement badge - small screen
   */
  achievementBadgeSmall: {
    marginHorizontal: 4,
  },

  /**
   * Badge title - small screen
   */
  badgeTitleSmall: {
    fontSize: 10,
  },

  /**
   * History header with title and view all button
   */
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  /**
   * Bottom padding for landscape mode
   */
  landscapeBottomPadding: {
    height: 80,
  },

  // ============================================================================
  // PORTRAIT MODE STYLES
  // ============================================================================

  /**
   * Portrait scroll view - white background matching cards
   */
  portraitScrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background matching cards
  },

  /**
   * Portrait scroll content
   */
  portraitScrollContent: {
    paddingBottom: 20,
  },

  /**
   * Portrait card - clean without shadow
   */
  portraitCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    padding: 20,
  
  },

  /**
   * Portrait first card - reduced top margin
   */
  portraitFirstCard: {

    marginTop:60,
  },

  /**
   * Portrait card title
   */
  portraitCardTitle: {
    fontSize: 20,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    marginBottom: 15,
  },

  /**
   * Portrait card header with title and view all
   */
  portraitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  /**
   * Portrait view all button
   */
  portraitViewAll: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },

  /**
   * Portrait progress bar
   */
  portraitProgressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 20,
  },

  /**
   * Portrait progress fill
   */
  portraitProgressFill: {
    height: '100%',
    backgroundColor: '#20A446',
    borderRadius: 2,
  },

  /**
   * Portrait main metrics row
   */
  portraitMainMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },

  /**
   * Portrait distance section
   */
  portraitDistanceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  /**
   * Portrait distance value
   */
  portraitDistanceValue: {
    fontSize: 40,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
  },

  /**
   * Portrait distance unit
   */
  portraitDistanceUnit: {
    fontSize: 22,
    color: '#000000',
    marginLeft: 8,
  },

  /**
   * Portrait speed section
   */
  portraitSpeedSection: {
    alignItems: 'flex-end',
  },

  /**
   * Portrait speed label
   */
  portraitSpeedLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },

  /**
   * Portrait speed value
   */
  portraitSpeedValue: {
    fontSize: 24,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
  },

  /**
   * Portrait bottom metrics row
   */
  portraitBottomMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  /**
   * Portrait metric item
   */
  portraitMetricItem: {
    alignItems: 'center',
  },

  /**
   * Portrait metric label
   */
  portraitMetricLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },

  /**
   * Portrait metric value
   */
  portraitMetricValue: {
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
  },

  /**
   * Portrait KPI row
   */
  portraitKpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  /**
   * Portrait KPI item
   */
  portraitKpiItem: {
    alignItems: 'center',
    flex: 1,
  },

  /**
   * Portrait KPI icon
   */
  portraitKpiIcon: {
    marginBottom: 8,
    tintColor: '#20A446',
    resizeMode: 'contain'
  },

  portraitKpiIconSmall: {
    marginBottom: 8,
    tintColor: '#20A446',
    resizeMode: 'contain',
    width: 40,
    height: 40,
  },

  portraitKpiIconLarge: {
    marginBottom: 8,
    tintColor: '#20A446',
    resizeMode: 'contain',
    width: 50,
    height: 50,
  },

  /**
   * Portrait KPI value
   */
  portraitKpiValue: {
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    color: '#000000',
    marginBottom: 4,
  },

  /**
   * Portrait KPI label
   */
  portraitKpiLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },

  /**
   * Portrait achievements row
   */
  portraitAchievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  /**
   * Portrait achievement badge
   */
  portraitAchievementBadge: {
    alignItems: 'center',
    flex: 1,
  },

  /**
   * Portrait badge icon
   */
  portraitBadgeIcon: {
    width: 100,
    height: 100,
    marginBottom: 8,
    resizeMode: 'contain'
  },

  /**
   * Portrait badge title
   */
  portraitBadgeTitle: {
    fontSize: 12,
    fontFamily: 'Lexend-Bold',
    color: '#20A446',
    marginBottom: 8,
  },

  portraitBadgeTitleSmall: {
    fontSize: 10,
    fontFamily: 'Lexend-Bold',
    color: '#20A446',
    marginBottom: 8,
  },

  portraitBadgeTitleLarge: {
    fontSize: 12,
    fontFamily: 'Lexend-Bold',
    color: '#20A446',
    marginBottom: 8,
  },

  /**
   * Portrait badge progress
   */
  portraitBadgeProgress: {
    width: 60,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },

  /**
   * Portrait badge progress fill
   */
  portraitBadgeProgressFill: {
    height: '100%',
    backgroundColor: '#20A446',
    borderRadius: 2,
  },

  /**
   * Portrait history chart
   */
  portraitHistoryChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 120,
  },

  /**
   * Portrait Y-axis labels
   */
  portraitYAxis: {
    justifyContent: 'space-between',
    height: 100,
    paddingRight: 8,
    alignItems: 'flex-end',
  },

  /**
   * Portrait Y-axis label
   */
  portraitYAxisLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },

  /**
   * Portrait chart area
   */
  portraitChartArea: {
    flex: 1,
    alignItems: 'center',
  },

  /**
   * Portrait chart bars
   */
  portraitChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 8,
    marginBottom: 10,
  },

  /**
   * Portrait bar wrapper
   */
  portraitBarWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },

  /**
   * Portrait bar remaining
   */
  portraitBarRemaining: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },

  /**
   * Portrait bar
   */
  portraitBar: {
    backgroundColor: '#20A446',
    borderRadius: 4,
    minHeight: 4,
  },

  /**
   * Portrait chart labels
   */
  portraitChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },

  /**
   * Portrait chart label
   */
  portraitChartLabel: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
    textAlign: 'center',
  },

  /**
   * Portrait chart legend
   */
  portraitChartLegend: {
    marginTop: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  /**
   * Portrait legend item
   */
  portraitLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /**
   * Portrait legend color indicator
   */
  portraitLegendColor: {
    width: 12,
    height: 12,
    backgroundColor: '#20A446',
    borderRadius: 2,
    marginRight: 8,
  },

  /**
   * Portrait legend text
   */
  portraitLegendText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },


});

export default HomeScreen; 