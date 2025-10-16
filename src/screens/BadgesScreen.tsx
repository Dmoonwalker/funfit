/**
 * @fileoverview Badges Screen for FunFeet Cycling App
 * 
 * Shows all achievement badges with progress and detailed information
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
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AchievementService, Badge } from '../services/AchievementService';
import { useAuth } from '../contexts/AuthContext';

interface BadgesScreenProps {
  navigation: any;
}

const BadgesScreen: React.FC<BadgesScreenProps> = ({ navigation }) => {
  const { currentUserId } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all badges
  const fetchBadges = async (showRefreshing = false) => {
    if (!currentUserId) return;
    
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      console.log('[BADGES_SCREEN] 🏆 Fetching all badges for user:', currentUserId);
      const allBadges = await AchievementService.getAllBadges(currentUserId);
      setBadges(allBadges);
      console.log('[BADGES_SCREEN] ✅ Loaded', allBadges.length, 'badges');
    } catch (error) {
      console.error('[BADGES_SCREEN] ❌ Failed to fetch badges:', error);
      setBadges([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, [currentUserId]);

  const handleRefresh = () => {
    fetchBadges(true);
  };

  const unlockedBadges = badges.filter(badge => badge.isUnlocked);
  const lockedBadges = badges.filter(badge => !badge.isUnlocked);

  const renderBadgeItem = (badge: Badge) => (
    <View key={badge.id} style={[
      styles.badgeItem,
      { opacity: badge.isUnlocked ? 1 : 0.7 }
    ]}>
      {/* Badge Icon */}
      <View style={[
        styles.badgeIcon,
        {
          backgroundColor: badge.isUnlocked ? '#20A446' : '#E0E4E7',
        }
      ]}>
        <Text style={styles.badgeEmoji}>{badge.icon}</Text>
        {badge.isUnlocked && (
          <View style={styles.unlockedIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>

      {/* Badge Info */}
      <View style={styles.badgeInfo}>
        <Text style={[
          styles.badgeName,
          { color: badge.isUnlocked ? '#1A1A1A' : '#666' }
        ]}>
          {badge.name}
        </Text>
        <Text style={styles.badgeDescription}>
          {badge.description}
        </Text>
        <Text style={styles.badgeMilestone}>
          {badge.milestone}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            {
              width: `${Math.round(badge.progress * 100)}%`,
              backgroundColor: badge.isUnlocked ? '#20A446' : '#4CAF50',
            }
          ]} />
        </View>
        <Text style={[
          styles.progressText,
          { color: badge.isUnlocked ? '#20A446' : '#666' }
        ]}>
          {badge.isUnlocked ? 'Unlocked!' : badge.progressText}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Achievements</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20A446" />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{unlockedBadges.length}</Text>
          <Text style={styles.statLabel}>Unlocked</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{lockedBadges.length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{badges.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Badges List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#20A446']}
          />
        }
      >
        {/* Unlocked Badges Section */}
        {unlockedBadges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🏆 Unlocked ({unlockedBadges.length})</Text>
            {unlockedBadges.map(renderBadgeItem)}
          </>
        )}

        {/* In Progress Badges Section */}
        {lockedBadges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🎯 In Progress ({lockedBadges.length})</Text>
            {lockedBadges.map(renderBadgeItem)}
          </>
        )}

        {badges.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🚴‍♂️</Text>
            <Text style={styles.emptyText}>No badges available</Text>
            <Text style={styles.emptySubtext}>Start cycling to earn achievements!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4E7',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#20A446',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4E7',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#20A446',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F5F7FA',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4E7',
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  badgeEmoji: {
    fontSize: 24,
  },
  unlockedIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeInfo: {
    flex: 1,
    marginRight: 12,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  badgeMilestone: {
    fontSize: 11,
    color: '#999',
  },
  progressContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: '#E0E4E7',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default BadgesScreen;
