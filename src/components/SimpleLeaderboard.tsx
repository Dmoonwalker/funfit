/**
 * @fileoverview Simple Leaderboard Component for HomeScreen
 * 
 * Shows top 5 users in a compact format for the home screen.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { LeaderboardService, LeaderboardEntry, LeaderboardCategory } from '../services/LeaderboardService';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// LeaderboardEntry is now imported from LeaderboardService

// ============================================================================
// CONSTANTS
// ============================================================================

// Dummy leaderboard data
const dummyData: LeaderboardEntry[] = [
  {
    user_id: '1',
    username: 'Mia T.',
    total_distance: 15.5,
    total_calories: 300,
    total_sessions: 8,
    best_speed: 18.2,
    rank: 1,
    avatar_url: 'avatar-2.jpg',
    avatar_gender: 'female',
  },
  {
    user_id: '2',
    username: 'Emma C.',
    total_distance: 14.8,
    total_calories: 300,
    total_sessions: 7,
    best_speed: 17.5,
    rank: 2,
    avatar_url: 'avatar-3.jpg',
    avatar_gender: 'female',
  },
  {
    user_id: '3',
    username: 'Liam T.',
    total_distance: 13.2,
    total_calories: 300,
    total_sessions: 6,
    best_speed: 16.8,
    rank: 3,
    avatar_gender: 'male',
  },
  {
    user_id: '4',
    username: 'Ayomide O.',
    total_distance: 12.1,
    total_calories: 300,
    total_sessions: 5,
    best_speed: 15.9,
    rank: 4,
    avatar_url: 'avatar-4.jpg',
    avatar_gender: 'male',
  },
  {
    user_id: '5',
    username: 'You',
    total_distance: 8.5,
    total_calories: 300,
    total_sessions: 3,
    best_speed: 12.3,
    rank: 28,
    avatar_gender: 'male',
  },
];

// ============================================================================
// SIMPLE LEADERBOARD COMPONENT
// ============================================================================

export const SimpleLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory] = useState<LeaderboardCategory>('distance');
  const [error, setError] = useState<string | null>(null);
  const { currentUserId } = useAuth();
  
  // Responsive design for small screens
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380 || screenHeight < 600;

  // Get avatar source based on avatar_url or avatar_gender
  const getAvatarSource = (entry: LeaderboardEntry) => {
    // If user has a specific avatar_url, use it
    if (entry.avatar_url) {
      switch (entry.avatar_url) {
        case 'avatar.jpg':
          return require('../../assets/avatar/avatar.jpg');
        case 'avatar-2.jpg':
          return require('../../assets/avatar/avatar-2.jpg');
        case 'avatar-3.jpg':
          return require('../../assets/avatar/avatar-3.jpg');
        case 'avatar-4.jpg':
          return require('../../assets/avatar/avatar-4.jpg');
        case 'avatar-5.jpg':
          return require('../../assets/avatar/avatar-5.jpg');
        case 'avatar-6.jpg':
          return require('../../assets/avatar/avatar-6.jpg');
        default:
          return require('../../assets/avatar/avatar.jpg');
      }
    }
    
    // Fallback to gender-based avatar
    if (entry.avatar_gender === 'female') {
      return require('../../assets/images/female.png');
    } else {
      return require('../../assets/images/male.png');
    }
  };

  // Load leaderboard data
  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[LEADERBOARD] 🏆 Loading leaderboard data...');
      
      // Test connection first
      const connectionOk = await LeaderboardService.testConnection();
      if (!connectionOk) {
        console.warn('[LEADERBOARD] ⚠️ Database connection failed, using dummy data');
        setLeaderboard(dummyData);
        return;
      }
      
      // Fetch real leaderboard data
      const topUsers = await LeaderboardService.getTopUsers(currentCategory, 5);
      
      if (topUsers.length === 0) {
        console.log('[LEADERBOARD] ℹ️ No real data found, using dummy data');
        setLeaderboard(dummyData);
      } else {
        console.log(`[LEADERBOARD] ✅ Loaded ${topUsers.length} real users`);
        
        // Add current user if they're not in top 5 but have sessions
        let finalLeaderboard = [...topUsers];
        
        if (currentUserId && !topUsers.find(u => u.user_id === currentUserId)) {
          const userRank = await LeaderboardService.getUserRank(currentUserId, currentCategory);
          if (userRank && userRank > 5) {
            // Add placeholder for current user (would need separate query to get their stats)
            finalLeaderboard.push({
              user_id: currentUserId,
              username: 'You',
              total_distance: 8.5,
              total_calories: 300,
              total_sessions: 3,
              best_speed: 12.3,
              rank: userRank,
            });
          }
        }
        
        setLeaderboard(finalLeaderboard);
      }
      
    } catch (loadError) {
      console.error('[LEADERBOARD] ❌ Load error:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load leaderboard');
      // Fallback to dummy data on error
      setLeaderboard(dummyData);
    } finally {
      setIsLoading(false);
    }
  }, [currentCategory, currentUserId]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Get rank display
  const getRankDisplay = (rank: number): string => {
    return `#${rank}`;
  };

  // Format values based on current category
  const formatValue = (entry: LeaderboardEntry): string => {
    switch (currentCategory) {
      case 'distance':
        return `${entry.total_distance.toFixed(1)} km`;
      case 'calories':
        return `${entry.total_calories}`;
      case 'speed':
        return `${entry.best_speed.toFixed(1)} km/h`;
      default:
        return `${entry.total_distance.toFixed(1)} km`;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[
          styles.loadingContainer,
          { paddingHorizontal: isSmallScreen ? 8 : 20 }
        ]}>
          <ActivityIndicator size="small" color="#20A446" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[
          styles.errorContainer,
          { paddingHorizontal: isSmallScreen ? 8 : 20 }
        ]}>
          <Text style={styles.errorText}>Failed to load</Text>
          <TouchableOpacity onPress={loadLeaderboard} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[
          styles.emptyContainer,
          { paddingHorizontal: isSmallScreen ? 8 : 20 }
        ]}>
          <Text style={styles.emptyText}>No data yet</Text>
          <TouchableOpacity onPress={loadLeaderboard} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Leaderboard Entries */}
      <View style={[
        styles.entriesContainer,
        { paddingHorizontal: isSmallScreen ? 8 : 16 }
      ]}>
        {leaderboard.map((entry) => (
          <View key={entry.user_id} style={[
            styles.entry,
            entry.username === 'You' && styles.currentUserEntry,
            {
              paddingVertical: isSmallScreen ? 8 : 12,
              paddingHorizontal: isSmallScreen ? 8 : 12
            }
          ]}>
            <Text style={[
              styles.rankText,
              entry.username === 'You' && styles.currentUserRank
            ]}>
              {getRankDisplay(entry.rank)}
            </Text>
            
            <Image 
              source={getAvatarSource(entry)} 
              style={[
                styles.avatar,
                { marginHorizontal: isSmallScreen ? 6 : 8 }
              ]}
            />
            
            <Text style={[
              styles.username,
              entry.username === 'You' && styles.currentUserName,
              { marginLeft: isSmallScreen ? 8 : 12 }
            ]}>
              {entry.username}
            </Text>
            <Text style={[
              styles.score,
              entry.username === 'You' && styles.currentUserScore
            ]}>
              {formatValue(entry)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },

  categorySelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
  },

  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  categoryButtonActive: {
    backgroundColor: '#20A446',
  },

  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 14,
    color: '#666666',
  },

  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#666666',
  },

  refreshButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshButtonText: {
    fontSize: 14,
    color: '#20A446',
    fontWeight: '600',
  },

  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  errorText: {
    fontSize: 14,
    color: '#FF4444',
    marginBottom: 8,
  },

  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#20A446',
    borderRadius: 6,
  },

  retryButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  entriesContainer: {
    paddingBottom: 8,
  },

  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  currentUserEntry: {
    backgroundColor: '#20A446',
    borderRadius: 8,
    marginVertical: 2,
    borderBottomWidth: 0,
  },

  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    width: 40,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  currentUserRank: {
    color: '#FFFFFF',
  },

  username: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },

  currentUserName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },

  currentUserScore: {
    color: '#FFFFFF',
  },
});

export default SimpleLeaderboard;
