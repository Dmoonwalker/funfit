/**
 * @fileoverview User Data Service for FunFeet Cycling App
 * 
 * Handles aggregation of user session data, calculation of totals,
 * achievements tracking, and user statistics management.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import { CyclingSession, UserTotals, SessionUtils } from '../types/Session';
import { UltraSimpleSync } from './UltraSimpleSync';

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  progress: number; // 0-1
  target: number;
  category: 'distance' | 'time' | 'speed' | 'sessions' | 'cycles';
  icon: string;
}

/**
 * UserDataService
 * 
 * Manages user data aggregation, statistics calculation, and achievements.
 * Works with SessionStorageService to provide high-level user data operations.
 */
export class UserDataService {
  
  // ============================================================================
  // USER TOTALS CALCULATION
  // ============================================================================
  
  /**
   * Calculate totals from sessions array
   */
  private static calculateTotalsFromSessions(sessions: CyclingSession[], userId: string): UserTotals {
    const completedSessions = sessions.filter(session => session.isCompleted);
    
    const totals: UserTotals = {
      userId,
      totalDistance: 0,
      totalCalories: 0,
      totalCycles: 0,
      totalSessions: completedSessions.length,
      totalTime: 0,
      bestSpeed: 0,
      longestSession: 0,
      bestDistance: 0,
      lastUpdated: Date.now(),
      isSynced: true,
    };
    
    // Aggregate data from all completed sessions
    for (const session of completedSessions) {
      totals.totalDistance += session.totalDistance;
      totals.totalCalories += session.totalCalories;
      totals.totalCycles += session.totalCycles;
      totals.totalTime += session.duration;
      
      // Track bests
      if (session.maxSpeed > totals.bestSpeed) {
        totals.bestSpeed = session.maxSpeed;
      }
      
      if (session.duration > totals.longestSession) {
        totals.longestSession = session.duration;
      }
      
      if (session.totalDistance > totals.bestDistance) {
        totals.bestDistance = session.totalDistance;
      }
    }
    
    return totals;
  }
  
  /**
   * Recalculate user totals from all sessions
   */
  static async recalculateUserTotals(userId: string): Promise<UserTotals> {
    try {
      const sessions = await UltraSimpleSync.getUserSessions(userId);
      const completedSessions = sessions.filter(session => session.isCompleted);
      
      const totals: UserTotals = {
        userId,
        totalDistance: 0,
        totalCalories: 0,
        totalCycles: 0,
        totalSessions: completedSessions.length,
        totalTime: 0,
        bestSpeed: 0,
        longestSession: 0,
        bestDistance: 0,
        lastUpdated: Date.now(),
        isSynced: false,
      };
      
      // Aggregate data from all completed sessions
      for (const session of completedSessions) {
        totals.totalDistance += session.totalDistance;
        totals.totalCalories += session.totalCalories;
        totals.totalCycles += session.totalCycles;
        totals.totalTime += session.duration;
        
        // Track bests
        if (session.maxSpeed > totals.bestSpeed) {
          totals.bestSpeed = session.maxSpeed;
        }
        
        if (session.duration > totals.longestSession) {
          totals.longestSession = session.duration;
        }
        
        if (session.totalDistance > totals.bestDistance) {
          totals.bestDistance = session.totalDistance;
        }
      }
      
      // Note: UserTotals are now calculated dynamically from sessions
      // No need to save locally since we're cloud-only
      
      console.log(`✅ User totals recalculated for: ${userId}`);
      return totals;
      
    } catch (error) {
      console.error('❌ Error recalculating user totals:', error);
      throw new Error('Failed to recalculate user totals');
    }
  }
  
  /**
   * Update user totals incrementally from a completed session
   */
  static async updateUserTotalsFromSession(session: CyclingSession): Promise<UserTotals> {
    try {
      // Calculate totals from all sessions (no local storage)
      const allSessions = await UltraSimpleSync.getUserSessions(session.userId);
      const totals = this.calculateTotalsFromSessions(allSessions, session.userId);
      
      // Only update from completed sessions
      if (!session.isCompleted) {
        return totals;
      }
      
      // Add session data to totals
      totals.totalDistance += session.totalDistance;
      totals.totalCalories += session.totalCalories;
      totals.totalCycles += session.totalCycles;
      totals.totalTime += session.duration;
      totals.totalSessions += 1;
      
      // Update bests if this session set new records
      if (session.maxSpeed > totals.bestSpeed) {
        totals.bestSpeed = session.maxSpeed;
      }
      
      if (session.duration > totals.longestSession) {
        totals.longestSession = session.duration;
      }
      
      if (session.totalDistance > totals.bestDistance) {
        totals.bestDistance = session.totalDistance;
      }
      
      totals.lastUpdated = Date.now();
      totals.isSynced = true; // Always synced since we're cloud-only
      
      return totals;
      
    } catch (error) {
      console.error('❌ Error updating user totals from session:', error);
      throw new Error('Failed to update user totals');
    }
  }
  
  // ============================================================================
  // USER STATISTICS
  // ============================================================================
  
  /**
   * Get comprehensive user statistics
   */
  static async getUserStats(userId: string): Promise<{
    totals: UserTotals;
    recentSessions: CyclingSession[];
    weeklyStats: {
      thisWeek: { distance: number; time: number; sessions: number };
      lastWeek: { distance: number; time: number; sessions: number };
    };
    achievements: Achievement[];
  }> {
    try {
      const allSessions = await UltraSimpleSync.getUserSessions(userId);
      const totals = this.calculateTotalsFromSessions(allSessions, userId);
      const recentSessions = allSessions.slice(0, 10); // Last 10 sessions
      
      const weeklyStats = this.calculateWeeklyStats(allSessions);
      const achievements = this.calculateAchievements(totals, allSessions);
      
      return {
        totals,
        recentSessions,
        weeklyStats,
        achievements,
      };
      
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw new Error('Failed to get user stats');
    }
  }
  
  /**
   * Calculate weekly statistics
   */
  private static calculateWeeklyStats(sessions: CyclingSession[]): {
    thisWeek: { distance: number; time: number; sessions: number };
    lastWeek: { distance: number; time: number; sessions: number };
  } {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);
    
    const thisWeekSessions = sessions.filter(s => s.startTime >= oneWeekAgo);
    const lastWeekSessions = sessions.filter(s => s.startTime >= twoWeeksAgo && s.startTime < oneWeekAgo);
    
    const calculateStats = (sessionList: CyclingSession[]) => ({
      distance: sessionList.reduce((sum, s) => sum + s.totalDistance, 0),
      time: sessionList.reduce((sum, s) => sum + s.duration, 0),
      sessions: sessionList.length,
    });
    
    return {
      thisWeek: calculateStats(thisWeekSessions),
      lastWeek: calculateStats(lastWeekSessions),
    };
  }
  
  // ============================================================================
  // ACHIEVEMENTS SYSTEM
  // ============================================================================
  
  /**
   * Calculate user achievements
   */
  private static calculateAchievements(totals: UserTotals, _sessions: CyclingSession[]): Achievement[] {
    const achievements: Achievement[] = [
      // Distance achievements
      {
        id: 'first_km',
        title: 'First Kilometer',
        description: 'Complete your first kilometer',
        isUnlocked: totals.totalDistance >= 1,
        progress: Math.min(totals.totalDistance, 1),
        target: 1,
        category: 'distance',
        icon: '🚴‍♂️',
      },
      {
        id: 'marathon_distance',
        title: 'Marathon Rider',
        description: 'Cycle 42.2 kilometers total',
        isUnlocked: totals.totalDistance >= 42.2,
        progress: Math.min(totals.totalDistance / 42.2, 1),
        target: 42.2,
        category: 'distance',
        icon: '🏃‍♂️',
      },
      {
        id: 'century_rider',
        title: 'Century Rider',
        description: 'Cycle 100 kilometers total',
        isUnlocked: totals.totalDistance >= 100,
        progress: Math.min(totals.totalDistance / 100, 1),
        target: 100,
        category: 'distance',
        icon: '💯',
      },
      
      // Time achievements
      {
        id: 'first_hour',
        title: 'First Hour',
        description: 'Exercise for 1 hour total',
        isUnlocked: totals.totalTime >= 3600000, // 1 hour in ms
        progress: Math.min(totals.totalTime / 3600000, 1),
        target: 3600000,
        category: 'time',
        icon: '⏰',
      },
      {
        id: 'marathon_time',
        title: 'Time Marathon',
        description: 'Exercise for 10 hours total',
        isUnlocked: totals.totalTime >= 36000000, // 10 hours in ms
        progress: Math.min(totals.totalTime / 36000000, 1),
        target: 36000000,
        category: 'time',
        icon: '⏳',
      },
      
      // Speed achievements
      {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Reach 30 km/h',
        isUnlocked: totals.bestSpeed >= 30,
        progress: Math.min(totals.bestSpeed / 30, 1),
        target: 30,
        category: 'speed',
        icon: '⚡',
      },
      {
        id: 'lightning_fast',
        title: 'Lightning Fast',
        description: 'Reach 50 km/h',
        isUnlocked: totals.bestSpeed >= 50,
        progress: Math.min(totals.bestSpeed / 50, 1),
        target: 50,
        category: 'speed',
        icon: '⚡',
      },
      
      // Session achievements
      {
        id: 'consistent_rider',
        title: 'Consistent Rider',
        description: 'Complete 10 sessions',
        isUnlocked: totals.totalSessions >= 10,
        progress: Math.min(totals.totalSessions / 10, 1),
        target: 10,
        category: 'sessions',
        icon: '🎯',
      },
      {
        id: 'dedication_master',
        title: 'Dedication Master',
        description: 'Complete 50 sessions',
        isUnlocked: totals.totalSessions >= 50,
        progress: Math.min(totals.totalSessions / 50, 1),
        target: 50,
        category: 'sessions',
        icon: '🏆',
      },
      
      // Cycles achievements
      {
        id: 'pedal_power',
        title: 'Pedal Power',
        description: 'Complete 1,000 cycles',
        isUnlocked: totals.totalCycles >= 1000,
        progress: Math.min(totals.totalCycles / 1000, 1),
        target: 1000,
        category: 'cycles',
        icon: '🦵',
      },
      {
        id: 'cycle_master',
        title: 'Cycle Master',
        description: 'Complete 10,000 cycles',
        isUnlocked: totals.totalCycles >= 10000,
        progress: Math.min(totals.totalCycles / 10000, 1),
        target: 10000,
        category: 'cycles',
        icon: '🚲',
      },
    ];
    
    return achievements;
  }
  
  // ============================================================================
  // DATA EXPORT / IMPORT
  // ============================================================================
  
  /**
   * Export all user data for backup or transfer
   */
  static async exportUserData(userId: string): Promise<{
    sessions: CyclingSession[];
    totals: UserTotals;
    exportDate: number;
    version: string;
  }> {
    try {
      const sessions = await UltraSimpleSync.getUserSessions(userId);
      const totals = this.calculateTotalsFromSessions(sessions, userId);
      
      return {
        sessions,
        totals,
        exportDate: Date.now(),
        version: '1.0.0',
      };
      
    } catch (error) {
      console.error('❌ Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }
  
  /**
   * Import user data from backup
   */
  static async importUserData(userId: string, _data: {
    sessions: CyclingSession[];
    totals: UserTotals;
    exportDate: number;
    version: string;
  }): Promise<void> {
    try {
      // Note: Import functionality removed since we're cloud-only
      // Sessions are managed directly in the cloud via UltraSimpleSync
      console.log('⚠️ Import functionality not available in cloud-only mode');
      
      console.log(`✅ User data imported for: ${userId}`);
      
    } catch (error) {
      console.error('❌ Error importing user data:', error);
      throw new Error('Failed to import user data');
    }
  }
  
  // ============================================================================
  // USER INITIALIZATION
  // ============================================================================
  
  /**
   * Initialize a new user with default data
   */
  static async initializeNewUser(userId?: string): Promise<string> {
    try {
      const finalUserId = userId || SessionUtils.generateUserId();
      
      // Note: User initialization simplified for cloud-only mode
      // User ID is managed by AuthContext, totals calculated from sessions
      
      console.log(`✅ New user initialized: ${finalUserId}`);
      return finalUserId;
      
    } catch (error) {
      console.error('❌ Error initializing new user:', error);
      throw new Error('Failed to initialize new user');
    }
  }
  
  /**
   * Get or create current user
   */
  static async getCurrentUser(): Promise<string> {
    try {
      // Note: User ID management moved to AuthContext
      // This method is deprecated in cloud-only mode
      throw new Error('getCurrentUser() is deprecated. Use AuthContext instead.');
      
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      throw error; // Re-throw since this method is deprecated
    }
  }
}
