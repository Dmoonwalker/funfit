/**
 * @fileoverview Badges Section Component for Home Screen
 * 
 * Shows top 3 achievement badges with "View All" button
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AchievementService, Badge } from '../services/AchievementService';
import BadgeCard from './BadgeCard';
import { useAuth } from '../contexts/AuthContext';

interface BadgesSectionProps {
  navigation: any;
}

const BadgesSection: React.FC<BadgesSectionProps> = ({ navigation }) => {
  const { currentUserId } = useAuth();
  const [topBadges, setTopBadges] = useState<Badge[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch top badges and unlocked count
  useEffect(() => {
    const fetchBadges = async () => {
      if (!currentUserId) return;
      
      setIsLoading(true);
      try {
        console.log('[BADGES_SECTION] 🏆 Fetching badges for user:', currentUserId);
        
        const [badges, count] = await Promise.all([
          AchievementService.getTopBadges(currentUserId),
          AchievementService.getUnlockedBadgesCount(currentUserId)
        ]);
        
        setTopBadges(badges);
        setUnlockedCount(count);
        console.log('[BADGES_SECTION] ✅ Loaded badges:', badges.length, 'unlocked:', count);
      } catch (error) {
        console.error('[BADGES_SECTION] ❌ Failed to fetch badges:', error);
        setTopBadges([]);
        setUnlockedCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, [currentUserId]);

  const handleViewAll = () => {
    navigation.navigate('Badges');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#20A446" />
          <Text style={styles.loadingText}>Loading badges...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>
            {unlockedCount} of 9 badges unlocked
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={handleViewAll}
        >
          <Text style={styles.viewAllText}>View All > </Text>
        </TouchableOpacity>
      </View>

      {/* Top 3 Badges */}
      <View style={styles.badgesContainer}>
        {topBadges.length > 0 ? (
          topBadges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              size="medium"
              showProgress={true}
            />
          ))
        ) : (
          <View style={styles.noBadgesContainer}>
            <Text style={styles.noBadgesText}>🚴‍♂️</Text>
            <Text style={styles.noBadgesSubtext}>Start cycling to earn badges!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',

    borderRadius: 12,
    padding: 16,
 
 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  viewAllButton: {

    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewAllText: {

    fontSize: 13,
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 120,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  noBadgesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  noBadgesText: {
    fontSize: 32,
    marginBottom: 8,
  },
  noBadgesSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default BadgesSection;
