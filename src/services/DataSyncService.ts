import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { authService } from './AuthService';

const supabaseUrl = 'https://uvcwmvnapuivacarkdbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Y3dtdm5hcHVpdmFjYXJrZGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzY3NTAsImV4cCI6MjA3MDA1Mjc1MH0.c_2Xp02ONjHk94vpxOM6B2T5f0d166JnVUJDuX0VP68';

// Database table names
const TABLES = {
  USERS: 'users',
  CYCLING_SESSIONS: 'cycling_sessions',
  USER_STATS: 'user_stats',
} as const;

// Database types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string;
}

export interface CyclingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  total_distance: number; // in meters
  total_calories: number;
  average_speed: number; // km/h
  max_speed: number; // km/h
  duration: number; // in seconds
  created_at: string;
  updated_at: string;
  synced_to_cloud: boolean;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_distance: number; // in meters
  total_calories: number;
  total_sessions: number;
  average_speed: number; // km/h
  max_speed: number; // km/h
  total_duration: number; // in seconds
  created_at: string;
  updated_at: string;
}

// Local storage keys
const STORAGE_KEYS = {
  CYCLING_SESSIONS: 'cycling_sessions',
  USER_STATS: 'user_stats',
  PENDING_SYNC: 'pending_sync',
} as const;

class DataSyncService {
  private supabase: any = null;
  private onlineStatus: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    this.checkConnectivity();
    this.setupConnectivityListener();
  }

  private getSupabase() {
    if (!this.supabase) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    return this.supabase;
  }

  // Check if device is online
  private async checkConnectivity(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.onlineStatus = response.ok;
    } catch (error) {
      this.onlineStatus = false;
    }
  }

  // Setup connectivity listener
  private setupConnectivityListener(): void {
    // Check connectivity every 30 seconds
    setInterval(() => {
      this.checkConnectivity();
    }, 30000);
  }

  // Save cycling session locally
  async saveCyclingSession(session: Omit<CyclingSession, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const sessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const fullSession: CyclingSession = {
        ...session,
        id: sessionId,
        created_at: now,
        updated_at: now,
        synced_to_cloud: false,
      };

      // Get existing sessions
      const existingSessions = await this.getLocalCyclingSessions();
      existingSessions.push(fullSession);

      // Save to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.CYCLING_SESSIONS, JSON.stringify(existingSessions));

      // Try to sync if online
      if (this.onlineStatus) {
        this.syncToCloud();
      }

      return sessionId;
    } catch (error) {
      console.error('Error saving cycling session locally:', error);
      throw error;
    }
  }

  // Get local cycling sessions
  async getLocalCyclingSessions(): Promise<CyclingSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.CYCLING_SESSIONS);
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (error) {
      console.error('Error getting local cycling sessions:', error);
      return [];
    }
  }

  // Update user stats locally
  async updateUserStats(stats: Partial<UserStats>): Promise<void> {
    try {
      const currentStats = await this.getLocalUserStats();
      const now = new Date().toISOString();
      
      // Create default stats if none exist
      const defaultStats: UserStats = {
        id: `local_${Date.now()}`,
        user_id: authService.getCurrentUser()?.id || '',
        total_distance: 0,
        total_calories: 0,
        total_sessions: 0,
        average_speed: 0,
        max_speed: 0,
        total_duration: 0,
        created_at: now,
        updated_at: now,
      };
      
      const updatedStats: UserStats = {
        ...defaultStats,
        ...currentStats,
        ...stats,
        updated_at: now,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(updatedStats));

      // Try to sync if online
      if (this.onlineStatus) {
        this.syncToCloud();
      }
    } catch (error) {
      console.error('Error updating user stats locally:', error);
      throw error;
    }
  }

  // Get local user stats
  async getLocalUserStats(): Promise<UserStats | null> {
    try {
      const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_STATS);
      return statsJson ? JSON.parse(statsJson) : null;
    } catch (error) {
      console.error('Error getting local user stats:', error);
      return null;
    }
  }

  // Sync data to cloud
  async syncToCloud(): Promise<void> {
    if (this.syncInProgress || !this.onlineStatus) {
      return;
    }

    this.syncInProgress = true;

    try {
      const user = authService.getCurrentUser();
      if (!user) {
        console.log('No authenticated user, skipping sync');
        return;
      }

      // Sync cycling sessions
      await this.syncCyclingSessions(user.id);

      // Sync user stats
      await this.syncUserStats(user.id);

      console.log('Data sync completed successfully');
    } catch (error) {
      console.error('Error syncing data to cloud:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync cycling sessions to cloud
  private async syncCyclingSessions(userId: string): Promise<void> {
    try {
      const localSessions = await this.getLocalCyclingSessions();
      const unsyncedSessions = localSessions.filter(session => !session.synced_to_cloud);

      for (const session of unsyncedSessions) {
        try {
          const supabase = this.getSupabase();
          const { error } = await supabase
            .from(TABLES.CYCLING_SESSIONS)
            .insert({
              user_id: userId,
              start_time: session.start_time,
              end_time: session.end_time,
              total_distance: session.total_distance,
              total_calories: session.total_calories,
              average_speed: session.average_speed,
              max_speed: session.max_speed,
              duration: session.duration,
            });

          if (!error) {
            // Mark as synced
            session.synced_to_cloud = true;
            session.updated_at = new Date().toISOString();
          }
        } catch (error) {
          console.error('Error syncing session:', session.id, error);
        }
      }

      // Update local storage with synced sessions
      await AsyncStorage.setItem(STORAGE_KEYS.CYCLING_SESSIONS, JSON.stringify(localSessions));
    } catch (error) {
      console.error('Error syncing cycling sessions:', error);
    }
  }

  // Sync user stats to cloud
  private async syncUserStats(userId: string): Promise<void> {
    try {
      const localStats = await this.getLocalUserStats();
      if (!localStats) return;

      const supabase = this.getSupabase();
      const { error } = await supabase
        .from(TABLES.USER_STATS)
        .upsert({
          user_id: userId,
          total_distance: localStats.total_distance,
          total_calories: localStats.total_calories,
          total_sessions: localStats.total_sessions,
          average_speed: localStats.average_speed,
          max_speed: localStats.max_speed,
          total_duration: localStats.total_duration,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error syncing user stats:', error);
      }
    } catch (error) {
      console.error('Error syncing user stats:', error);
    }
  }

  // Get user stats from cloud
  async getUserStatsFromCloud(userId: string): Promise<UserStats | null> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from(TABLES.USER_STATS)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user stats from cloud:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user stats from cloud:', error);
      return null;
    }
  }

  // Get cycling sessions from cloud
  async getCyclingSessionsFromCloud(userId: string): Promise<CyclingSession[]> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from(TABLES.CYCLING_SESSIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cycling sessions from cloud:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching cycling sessions from cloud:', error);
      return [];
    }
  }

  // Merge local and cloud data
  async mergeLocalAndCloudData(userId: string): Promise<void> {
    try {
      const localSessions = await this.getLocalCyclingSessions();
      const cloudSessions = await this.getCyclingSessionsFromCloud(userId);
      const cloudStats = await this.getUserStatsFromCloud(userId);

      // Merge sessions (avoid duplicates)
      const mergedSessions = [...localSessions];
      for (const cloudSession of cloudSessions) {
        const exists = mergedSessions.find(s => s.id === cloudSession.id);
        if (!exists) {
          mergedSessions.push(cloudSession);
        }
      }

      // Save merged sessions
      await AsyncStorage.setItem(STORAGE_KEYS.CYCLING_SESSIONS, JSON.stringify(mergedSessions));

      // Update local stats with cloud data if available
      if (cloudStats) {
        await this.updateUserStats(cloudStats);
      }
    } catch (error) {
      console.error('Error merging local and cloud data:', error);
    }
  }

  // Clear local data
  async clearLocalData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CYCLING_SESSIONS,
        STORAGE_KEYS.USER_STATS,
        STORAGE_KEYS.PENDING_SYNC,
      ]);
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }

  // Check if online
  isOnline(): boolean {
    return this.onlineStatus;
  }

  // Force sync
  async forceSync(): Promise<void> {
    await this.checkConnectivity();
    await this.syncToCloud();
  }
}

export const dataSyncService = new DataSyncService(); 