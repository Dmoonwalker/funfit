/**
 * @fileoverview Leaderboard Service for FunFeet Cycling App
 * 
 * Handles fetching and processing leaderboard data from Supabase.
 * Aggregates session data and joins with user profiles to show top performers.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import { supabase } from '../config/supabase';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Leaderboard entry with user info and aggregated stats
 */
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_distance: number;
  total_calories: number;
  total_sessions: number;
  best_speed: number;
  rank: number;
  avatar_url?: string;
  avatar_gender?: 'male' | 'female';
}


/**
 * Leaderboard category for sorting/filtering
 */
export type LeaderboardCategory = 'distance' | 'calories' | 'speed';

// ============================================================================
// LEADERBOARD SERVICE CLASS
// ============================================================================

/**
 * LeaderboardService - Handles all leaderboard data operations
 */
export class LeaderboardService {
  
  /**
   * Fetch top 5 users by specified category
   * 
   * @param category - Category to sort by ('distance', 'calories', or 'speed')
   * @param limit - Number of top users to return (default: 5)
   * @returns Promise<LeaderboardEntry[]> - Array of leaderboard entries
   */
  static async getTopUsers(category: LeaderboardCategory = 'distance', limit: number = 5): Promise<LeaderboardEntry[]> {
    try {
      console.log(`[LEADERBOARD] 🏆 Fetching top ${limit} users by ${category}...`);
      
      
      // Step 1: Get all sessions data
      console.log('[LEADERBOARD] 📊 Fetching sessions data...');
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('user_id, distance, calories, speed')
        .gt('distance', 0); // Only include sessions with actual data
      
      if (sessionsError) {
        console.error('[LEADERBOARD] ❌ Sessions query error:', sessionsError);
        throw new Error(`Failed to fetch sessions data: ${sessionsError.message}`);
      }
      
      if (!sessionsData || sessionsData.length === 0) {
        console.log('[LEADERBOARD] ℹ️ No session data found');
        return [];
      }
      
      console.log(`[LEADERBOARD] 📊 Processing ${sessionsData.length} session records...`);
      
      // Step 2: Get unique user IDs
      const uniqueUserIds = [...new Set(sessionsData.map(session => session.user_id))];
      console.log(`[LEADERBOARD] 👥 Found ${uniqueUserIds.length} unique users`);
      
      // Step 3: Get usernames and avatar info for these users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url, avatar_gender')
        .in('id', uniqueUserIds);
      
      if (usersError) {
        console.warn('[LEADERBOARD] ⚠️ Users query error, using user IDs as names:', usersError.message);
      }
      
      // Create user info lookup map
      const userInfoMap = new Map<string, {
        username: string;
        avatar_url?: string;
        avatar_gender?: 'male' | 'female';
      }>();
      if (usersData) {
        usersData.forEach(user => {
          userInfoMap.set(user.id, {
            username: user.username || user.id.substring(0, 8),
            avatar_url: user.avatar_url,
            avatar_gender: user.avatar_gender,
          });
        });
      }
      
      // Step 4: Aggregate data by user_id
      const userStats = new Map<string, {
        user_id: string;
        username: string;
        total_distance: number;
        total_calories: number;
        total_sessions: number;
        best_speed: number;
        avatar_url?: string;
        avatar_gender?: 'male' | 'female';
      }>();
      
      sessionsData.forEach((session: any) => {
        const userId = session.user_id;
        const userInfo = userInfoMap.get(userId);
        const username = userInfo?.username || `User ${userId.substring(0, 8)}`;
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            username: username,
            total_distance: 0,
            total_calories: 0,
            total_sessions: 0,
            best_speed: 0,
            avatar_url: userInfo?.avatar_url,
            avatar_gender: userInfo?.avatar_gender,
          });
        }
        
        const stats = userStats.get(userId)!;
        stats.total_distance += parseFloat(session.distance) || 0;
        stats.total_calories += parseInt(session.calories, 10) || 0;
        stats.total_sessions += 1;
        stats.best_speed = Math.max(stats.best_speed, parseFloat(session.speed) || 0);
      });
      
      // Convert to array and sort by category
      const aggregatedData = Array.from(userStats.values());
      
      // Sort by the specified category
      aggregatedData.sort((a, b) => {
        switch (category) {
          case 'distance':
            return b.total_distance - a.total_distance;
          case 'calories':
            return b.total_calories - a.total_calories;
          case 'speed':
            return b.best_speed - a.best_speed;
          default:
            return b.total_distance - a.total_distance;
        }
      });
      
      // Take top N and add ranks
      const topUsers = aggregatedData.slice(0, limit).map((user, index) => ({
        ...user,
        rank: index + 1,
        // Round numbers for display
        total_distance: Math.round(user.total_distance * 100) / 100,
        best_speed: Math.round(user.best_speed * 100) / 100,
      }));
      
      console.log(`[LEADERBOARD] ✅ Successfully processed top ${topUsers.length} users`);
      console.log('[LEADERBOARD] 📋 Top users:', topUsers.map(u => `${u.rank}. ${u.username} (${category}: ${u[`total_${category}` as keyof typeof u] || u.best_speed})`));
      
      return topUsers;
      
    } catch (error) {
      console.error('[LEADERBOARD] 💥 Service error:', error);
      throw error;
    }
  }
  
  /**
   * Get current user's rank in specified category
   * 
   * @param userId - Current user's ID
   * @param category - Category to check rank for
   * @returns Promise<number | null> - User's rank or null if not found
   */
  static async getUserRank(userId: string, category: LeaderboardCategory = 'distance'): Promise<number | null> {
    try {
      console.log(`[LEADERBOARD] 🔍 Getting user rank for ${userId} in ${category}...`);
      
      // Get all users' stats (similar to getTopUsers but without limit)
      const allUsers = await this.getTopUsers(category, 1000); // Large limit to get all users
      
      // Find user's position
      const userIndex = allUsers.findIndex(user => user.user_id === userId);
      
      if (userIndex === -1) {
        console.log(`[LEADERBOARD] ℹ️ User ${userId} not found in leaderboard`);
        return null;
      }
      
      const rank = userIndex + 1;
      console.log(`[LEADERBOARD] ✅ User ${userId} rank: ${rank}`);
      return rank;
      
    } catch (error) {
      console.error('[LEADERBOARD] ❌ Get user rank error:', error);
      return null;
    }
  }
  
  /**
   * Get user's personal best statistics (highest single session distance, calories, badges)
   * 
   * @param userId - User's ID
   * @returns Promise<{distance: number, calories: number, badges: number} | null> - User's best session stats or null if not found
   */
  static async getUserStats(userId: string): Promise<{distance: number, calories: number, badges: number} | null> {
    try {
      console.log(`[LEADERBOARD] 📊 Fetching user stats for ${userId}...`);
      
      // Get all sessions for this user
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('distance, calories')
        .eq('user_id', userId)
        .gt('distance', 0); // Only include sessions with actual data
      
      if (sessionsError) {
        console.error('[LEADERBOARD] ❌ User sessions query error:', sessionsError);
        throw new Error(`Failed to fetch user sessions: ${sessionsError.message}`);
      }
      
      if (!sessionsData || sessionsData.length === 0) {
        console.log(`[LEADERBOARD] ℹ️ No session data found for user ${userId}`);
        return { distance: 0, calories: 0, badges: 0 };
      }
      
      // Calculate highest single session values (not totals)
      const maxDistance = Math.max(...sessionsData.map(session => parseFloat(session.distance) || 0));
      const maxCalories = Math.max(...sessionsData.map(session => parseInt(session.calories, 10) || 0));
      
      // Calculate badges based on achievements (simple logic for now)
      // Badge for every 5km in a single session (adjusted for single session)
      const badges = Math.floor(maxDistance / 5);
      
      const userStats = {
        distance: Math.round(maxDistance * 100) / 100, // Round to 2 decimal places
        calories: maxCalories,
        badges: badges
      };
      
      console.log(`[LEADERBOARD] ✅ User stats for ${userId}:`, userStats);
      return userStats;
      
    } catch (error) {
      console.error('[LEADERBOARD] 💥 Get user stats error:', error);
      return null;
    }
  }

  /**
   * Test database connection and permissions
   * 
   * @returns Promise<boolean> - True if connection and permissions are working
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('[LEADERBOARD] 🧪 Testing database connection...');
      
      // Test basic sessions table access
      const { error: sessionsError } = await supabase
        .from('sessions')
        .select('id')
        .limit(1);
      
      if (sessionsError) {
        console.error('[LEADERBOARD] ❌ Sessions table access failed:', sessionsError);
        return false;
      }
      
      // Test users table access (optional, leaderboard can work without it)
      const { error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (usersError) {
        console.warn('[LEADERBOARD] ⚠️ Users table access failed (will use user IDs as names):', usersError);
        // Don't return false - leaderboard can work without users table
      }
      
      console.log('[LEADERBOARD] ✅ Database connection test successful');
      return true;
      
    } catch (error) {
      console.error('[LEADERBOARD] 💥 Connection test error:', error);
      return false;
    }
  }
}
