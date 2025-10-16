/**
 * @fileoverview Achievement Service for FunFeet Cycling App
 * 
 * This service handles all achievement badge logic including:
 * - Badge definitions and milestones
 * - Progress calculations
 * - Achievement status checking
 * - Badge unlocking logic
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import { supabase } from '../config/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface Badge {
  id: number;
  name: string;
  description: string;
  milestone: string;
  icon: string;
  isUnlocked: boolean;
  progress: number; // 0-1 (0% to 100%)
  progressText: string;
  category: 'distance' | 'rides' | 'speed';
}

export interface UserStats {
  totalDistance: number;      // km
  totalRides: number;         // count
  maxSpeed: number;          // km/h (placeholder for future)
  maxSingleRideDistance: number; // km
}

// ============================================================================
// BADGE DEFINITIONS
// ============================================================================

const BADGE_DEFINITIONS = [
  {
    id: 1,
    name: "Cyclist Noob",
    description: "Complete your first ride",
    milestone: "1 ride",
    icon: "🚴‍♂️",
    category: "rides" as const,
    requirement: { rides: 1 }
  },
  {
    id: 2,
    name: "Road Rookie", 
    description: "Pedal your way to 10 km",
    milestone: "10 km total distance",
    icon: "🛣️",
    category: "distance" as const,
    requirement: { totalDistance: 10 }
  },
  {
    id: 3,
    name: "Pedal Pusher",
    description: "Push through 50 km of cycling",
    milestone: "50 km total distance", 
    icon: "💪",
    category: "distance" as const,
    requirement: { totalDistance: 50 }
  },
  {
    id: 4,
    name: "Cyclist Pro",
    description: "Reach the 100 km milestone",
    milestone: "100 km total distance",
    icon: "🏆",
    category: "distance" as const,
    requirement: { totalDistance: 100 }
  },
  {
    id: 6,
    name: "Road Warrior",
    description: "Complete 25 epic rides",
    milestone: "25 rides completed",
    icon: "⚔️",
    category: "rides" as const,
    requirement: { rides: 25 }
  },
  {
    id: 7,
    name: "Cyclist Master",
    description: "Master the road with 500 km",
    milestone: "500 km total distance",
    icon: "👑",
    category: "distance" as const,
    requirement: { totalDistance: 500 }
  },
  {
    id: 8,
    name: "Speed Demon",
    description: "Hit the speed limit of 40 km/h",
    milestone: "Top speed ≥ 40 km/h",
    icon: "⚡",
    category: "speed" as const,
    requirement: { maxSpeed: 40 }
  },
  {
    id: 9,
    name: "Endurance Beast",
    description: "Show true endurance",
    milestone: "1000 km total distance or 100 rides",
    icon: "🦁",
    category: "distance" as const,
    requirement: { totalDistance: 1000, rides: 100 } // OR condition
  },
  {
    id: 10,
    name: "Cyclist Legend",
    description: "Become a cycling legend",
    milestone: "2500 km total distance or 100 km single ride",
    icon: "🌟",
    category: "distance" as const,
    requirement: { totalDistance: 2500, maxSingleRideDistance: 100 } // OR condition
  }
];

// ============================================================================
// ACHIEVEMENT SERVICE CLASS
// ============================================================================

export class AchievementService {
  
  /**
   * Get user's cycling statistics from database
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      console.log(`[ACHIEVEMENT] 📊 Fetching user stats for ${userId}...`);
      
      // Get all sessions for this user
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('distance, calories, created_at')
        .eq('user_id', userId)
        .gt('distance', 0); // Only sessions with actual data

      if (sessionsError) {
        console.error('[ACHIEVEMENT] ❌ Sessions query error:', sessionsError);
        throw new Error(`Failed to fetch user sessions: ${sessionsError.message}`);
      }

      if (!sessionsData || sessionsData.length === 0) {
        console.log(`[ACHIEVEMENT] ℹ️ No session data found for user ${userId}`);
        return {
          totalDistance: 0,
          totalRides: 0,
          maxSpeed: 0,
          maxSingleRideDistance: 0
        };
      }

      // Calculate statistics
      const totalDistance = sessionsData.reduce((sum, session) => sum + (parseFloat(session.distance) || 0), 0);
      const totalRides = sessionsData.length;
      const maxSingleRideDistance = Math.max(...sessionsData.map(session => parseFloat(session.distance) || 0));
      
      // TODO: Add speed when available in database
      const maxSpeed = 0; // Placeholder

      const userStats: UserStats = {
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalRides,
        maxSpeed,
        maxSingleRideDistance: Math.round(maxSingleRideDistance * 100) / 100
      };

      console.log(`[ACHIEVEMENT] ✅ User stats calculated:`, userStats);
      return userStats;

    } catch (error) {
      console.error('[ACHIEVEMENT] 💥 Get user stats error:', error);
      return {
        totalDistance: 0,
        totalRides: 0,
        maxSpeed: 0,
        maxSingleRideDistance: 0
      };
    }
  }

  /**
   * Calculate progress for a specific badge
   */
  static calculateBadgeProgress(badge: typeof BADGE_DEFINITIONS[0], userStats: UserStats): { progress: number, progressText: string, isUnlocked: boolean } {
    const req = badge.requirement;
    let progress = 0;
    let isUnlocked = false;
    let progressText = '';

    switch (badge.id) {
      case 1: // Cyclist Noob - 1 ride
        progress = Math.min(userStats.totalRides / req.rides!, 1);
        isUnlocked = userStats.totalRides >= req.rides!;
        progressText = `${userStats.totalRides}/${req.rides} rides`;
        break;

      case 2: // Road Rookie - 10 km
        progress = Math.min(userStats.totalDistance / req.totalDistance!, 1);
        isUnlocked = userStats.totalDistance >= req.totalDistance!;
        progressText = `${userStats.totalDistance.toFixed(1)}/${req.totalDistance} km`;
        break;

      case 3: // Pedal Pusher - 50 km
        progress = Math.min(userStats.totalDistance / req.totalDistance!, 1);
        isUnlocked = userStats.totalDistance >= req.totalDistance!;
        progressText = `${userStats.totalDistance.toFixed(1)}/${req.totalDistance} km`;
        break;

      case 4: // Cyclist Pro - 100 km
        progress = Math.min(userStats.totalDistance / req.totalDistance!, 1);
        isUnlocked = userStats.totalDistance >= req.totalDistance!;
        progressText = `${userStats.totalDistance.toFixed(1)}/${req.totalDistance} km`;
        break;


      case 6: // Road Warrior - 25 rides
        progress = Math.min(userStats.totalRides / req.rides!, 1);
        isUnlocked = userStats.totalRides >= req.rides!;
        progressText = `${userStats.totalRides}/${req.rides} rides`;
        break;

      case 7: // Cyclist Master - 500 km
        progress = Math.min(userStats.totalDistance / req.totalDistance!, 1);
        isUnlocked = userStats.totalDistance >= req.totalDistance!;
        progressText = `${userStats.totalDistance.toFixed(1)}/${req.totalDistance} km`;
        break;

      case 8: // Speed Demon - 40 km/h (placeholder)
        progress = Math.min(userStats.maxSpeed / req.maxSpeed!, 1);
        isUnlocked = userStats.maxSpeed >= req.maxSpeed!;
        progressText = `${userStats.maxSpeed.toFixed(1)}/${req.maxSpeed} km/h`;
        break;

      case 9: // Endurance Beast - 1000 km OR 100 rides
        const distanceProgress = userStats.totalDistance / req.totalDistance!;
        const ridesProgress = userStats.totalRides / req.rides!;
        progress = Math.min(Math.max(distanceProgress, ridesProgress), 1);
        isUnlocked = userStats.totalDistance >= req.totalDistance! || userStats.totalRides >= req.rides!;
        progressText = `${userStats.totalDistance.toFixed(1)}/${req.totalDistance} km or ${userStats.totalRides}/${req.rides} rides`;
        break;

      case 10: // Cyclist Legend - 2500 km OR 100 km single ride
        const totalDistProgress = userStats.totalDistance / req.totalDistance!;
        const singleRideProgress = userStats.maxSingleRideDistance / req.maxSingleRideDistance!;
        progress = Math.min(Math.max(totalDistProgress, singleRideProgress), 1);
        isUnlocked = userStats.totalDistance >= req.totalDistance! || userStats.maxSingleRideDistance >= req.maxSingleRideDistance!;
        progressText = `${userStats.totalDistance.toFixed(1)}/${req.totalDistance} km or ${userStats.maxSingleRideDistance.toFixed(1)}/${req.maxSingleRideDistance} km single`;
        break;

      default:
        progressText = 'Not available';
        break;
    }

    return {
      progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
      progressText,
      isUnlocked
    };
  }

  /**
   * Get all badges with progress for a user
   */
  static async getAllBadges(userId: string): Promise<Badge[]> {
    try {
      console.log(`[ACHIEVEMENT] 🏆 Getting all badges for user ${userId}...`);
      
      const userStats = await this.getUserStats(userId);
      
      const badges: Badge[] = BADGE_DEFINITIONS.map(badgeDef => {
        const { progress, progressText, isUnlocked } = this.calculateBadgeProgress(badgeDef, userStats);
        
        return {
          id: badgeDef.id,
          name: badgeDef.name,
          description: badgeDef.description,
          milestone: badgeDef.milestone,
          icon: badgeDef.icon,
          isUnlocked,
          progress,
          progressText,
          category: badgeDef.category
        };
      });

      console.log(`[ACHIEVEMENT] ✅ Calculated ${badges.length} badges`);
      return badges;

    } catch (error) {
      console.error('[ACHIEVEMENT] 💥 Get all badges error:', error);
      return [];
    }
  }

  /**
   * Get top 3 badges for home screen (next to unlock or recently unlocked)
   */
  static async getTopBadges(userId: string): Promise<Badge[]> {
    try {
      console.log(`[ACHIEVEMENT] 🥇 Getting top 3 badges for user ${userId}...`);
      
      const allBadges = await this.getAllBadges(userId);
      
      // Sort badges by priority:
      // 1. Recently unlocked badges (progress = 1)
      // 2. Badges closest to unlocking (highest progress < 1)
      // 3. Early stage badges for new users
      const sortedBadges = allBadges.sort((a, b) => {
        // Unlocked badges first (recently achieved)
        if (a.isUnlocked && !b.isUnlocked) return -1;
        if (!a.isUnlocked && b.isUnlocked) return 1;
        
        // If both unlocked or both not unlocked, sort by progress (descending)
        if (a.progress !== b.progress) return b.progress - a.progress;
        
        // If same progress, prioritize earlier badges (lower ID)
        return a.id - b.id;
      });

      const topBadges = sortedBadges.slice(0, 3);
      console.log(`[ACHIEVEMENT] ✅ Selected top 3 badges:`, topBadges.map(b => `${b.name} (${Math.round(b.progress * 100)}%)`));
      
      return topBadges;

    } catch (error) {
      console.error('[ACHIEVEMENT] 💥 Get top badges error:', error);
      return [];
    }
  }

  /**
   * Get count of unlocked badges
   */
  static async getUnlockedBadgesCount(userId: string): Promise<number> {
    try {
      const allBadges = await this.getAllBadges(userId);
      const unlockedCount = allBadges.filter(badge => badge.isUnlocked).length;
      console.log(`[ACHIEVEMENT] 🎖️ User has ${unlockedCount} unlocked badges`);
      return unlockedCount;
    } catch (error) {
      console.error('[ACHIEVEMENT] 💥 Get unlocked badges count error:', error);
      return 0;
    }
  }
}
