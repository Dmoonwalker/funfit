/**
 * @fileoverview Session Data Types for FunFeet Cycling App
 * 
 * Defines TypeScript interfaces for cycling session data storage,
 * user totals, and related data structures used across the application.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

/**
 * Individual cycling session data
 * Represents a single workout session with all tracked metrics
 */
export interface CyclingSession {
  /** Unique session identifier (UUID) */
  id: string;
  
  /** User ID (for multi-user support) */
  userId: string;
  
  /** Session start timestamp (Unix milliseconds) */
  startTime: number;
  
  /** Session end timestamp (Unix milliseconds) - undefined if session is active */
  endTime?: number;
  
  /** Total distance covered in kilometers */
  totalDistance: number;
  
  /** Total calories burned (estimated) */
  totalCalories: number;
  
  /** Total pedal cycles completed */
  totalCycles: number;
  
  /** Maximum speed reached during session (km/h) */
  maxSpeed: number;
  
  /** Average speed during session (km/h) */
  avgSpeed: number;
  
  /** Session duration in milliseconds */
  duration: number;
  
  /** Whether the session was completed normally (vs interrupted) */
  isCompleted: boolean;
  
  /** Session creation timestamp for local storage */
  createdAt: number;
  
  /** Last update timestamp for local storage */
  updatedAt: number;
  
  /** Whether session has been synced to cloud */
  isSynced: boolean;
  
  /** Optional session notes or tags */
  notes?: string;
  
  /** User's weight in kg (for MET-based calorie calculation) */
  userWeight?: number;
}

/**
 * Aggregated user totals across all sessions
 * Used for displaying lifetime statistics and achievements
 */
export interface UserTotals {
  /** User ID */
  userId: string;
  
  /** Total distance across all sessions (km) */
  totalDistance: number;
  
  /** Total calories burned across all sessions */
  totalCalories: number;
  
  /** Total cycles completed across all sessions */
  totalCycles: number;
  
  /** Total number of completed sessions */
  totalSessions: number;
  
  /** Total workout time across all sessions (milliseconds) */
  totalTime: number;
  
  /** Best/highest speed ever recorded (km/h) */
  bestSpeed: number;
  
  /** Longest single session duration (milliseconds) */
  longestSession: number;
  
  /** Most distance covered in a single session (km) */
  bestDistance: number;
  
  /** Last time totals were calculated */
  lastUpdated: number;
  
  /** Whether totals have been synced to cloud */
  isSynced: boolean;
}

/**
 * Real-time session data during active workout
 * Used for tracking current session progress
 */
export interface ActiveSession {
  /** Current session data */
  session: CyclingSession;
  
  /** Real-time metrics */
  currentSpeed: number;
  currentDistance: number;
  currentCycles: number;
  currentCalories: number;
  
  /** Session timing */
  elapsedTime: number;
  lastSaveTime: number;
  
  /** BLE connection status */
  isConnected: boolean;
  
  /** Speed tracking for averages */
  speedReadings: number[];
  maxSpeedReadings: number; // Limit array size
}

/**
 * Session storage configuration
 */
export interface SessionConfig {
  /** How often to save session data (milliseconds) */
  saveInterval: number;
  
  /** Maximum number of speed readings to keep for averaging */
  maxSpeedReadings: number;
  
  /** Auto-start session when BLE connects */
  autoStartOnConnect: boolean;
  
  /** Auto-end session when BLE disconnects */
  autoEndOnDisconnect: boolean;
  
  /** Minimum session duration to save (milliseconds) */
  minSessionDuration: number;
}

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  /** User sessions list: user_${userId}_sessions */
  USER_SESSIONS: (userId: string) => `user_${userId}_sessions`,
  
  /** Individual session: user_${userId}_session_${sessionId} */
  SESSION_DATA: (userId: string, sessionId: string) => `user_${userId}_session_${sessionId}`,
  
  /** User totals: user_${userId}_totals */
  USER_TOTALS: (userId: string) => `user_${userId}_totals`,
  
  /** Current active session: current_session */
  CURRENT_SESSION: 'current_session',
  
  /** Session configuration: session_config */
  SESSION_CONFIG: 'session_config',
  
  /** Current user ID: current_user_id */
  CURRENT_USER_ID: 'current_user_id',
} as const;

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  saveInterval: 5000, // 5 seconds
  maxSpeedReadings: 60, // Keep last 60 readings (~5 minutes at 5sec intervals)
  autoStartOnConnect: true,
  autoEndOnDisconnect: true,
  minSessionDuration: 30000, // 30 seconds minimum
};

/**
 * Utility functions for session data
 */
export class SessionUtils {
  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate a unique user ID (for guest users)
   */
  static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Calculate session duration
   */
  static calculateDuration(startTime: number, endTime?: number): number {
    return (endTime || Date.now()) - startTime;
  }
  
  /**
   * Calculate average speed from readings
   */
  static calculateAverageSpeed(speedReadings: number[]): number {
    if (speedReadings.length === 0) return 0;
    const sum = speedReadings.reduce((acc, speed) => acc + speed, 0);
    return sum / speedReadings.length;
  }
  
  /**
   * Estimate calories from cycles (rough approximation)
   */
  static estimateCalories(cycles: number): number {
    // Rough estimate: ~0.1 calories per cycle
    return Math.round(cycles * 0.1);
  }
  
  /**
   * Format duration for display (HH:MM:SS)
   */
  static formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
