
/**
 * ULTRA SIMPLE SYNC
 * 1. Session starts → INSERT to cloud
 * 2. During session → UPDATE distance, calories, cycles, duration
 * 3. Session ends → UPDATE end_time, is_active = false
 */

import { supabase } from '../config/supabase';
import { CyclingSession } from '../types/Session';

export class UltraSimpleSync {
  
  /**
   * Test function to verify logging works
   */
  static testLogging(): void {
    console.log('[SYNC] 🧪 TEST: UltraSimpleSync logging is working!');
    console.log('[SYNC] 📅 Current time:', new Date().toISOString());
  }

  /**
   * Test database connection and table access
   */
  static async testDatabaseConnection(): Promise<boolean> {
    try {
      console.log('[SYNC] 🧪 Testing database connection...');
      
      // Test 1: Check if we can read from sessions table
      const { data: countData, error: countError } = await supabase
        .from('sessions')
        .select('count(*)')
        .limit(1);

      if (countError) {
        console.error('[SYNC] ❌ Count query failed:', countError);
        return false;
      }
      console.log('[SYNC] ✅ Count query successful:', countData);

      // Test 2: Try to insert a test record
      const testSessionId = 'test-' + Date.now();
      const { data: insertData, error: insertError } = await supabase
        .from('sessions')
        .insert({
          user_id: 'test-user',
          session_id: testSessionId,
          start_time: new Date().toISOString(),
          duration: 0,
          distance: 0,
          speed: 0,
          calories: 0,
          cycles: 0,
        })
        .select();
        
      if (insertError) {
        console.error('[SYNC] ❌ Insert test failed:', insertError);
        return false;
      }
      console.log('[SYNC] ✅ Insert test successful:', insertData);
      
      // Test 3: Try to update the test record
      const { data: updateData, error: updateError } = await supabase
        .from('sessions')
        .update({
          distance: 1.5,
          duration: 300,
        })
        .eq('session_id', testSessionId)
        .select();
        
      if (updateError) {
        console.error('[SYNC] ❌ Update test failed:', updateError);
        return false;
      }
      console.log('[SYNC] ✅ Update test successful:', updateData);
      
      // Test 4: Clean up test record
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('session_id', testSessionId);
        
      if (deleteError) {
        console.error('[SYNC] ❌ Delete test failed:', deleteError);
      } else {
        console.log('[SYNC] ✅ Delete test successful');
      }
   
      console.log('[SYNC] 🎉 All database tests passed!');
      return true;
      
    } catch (error) {
      console.error('[SYNC] ❌ Database test error:', error);
      return false;
    }
  }
  
  /**
   * 1. SESSION STARTS → INSERT to cloud
   */
  static async startSession(session: CyclingSession): Promise<boolean> {
    try {
      // Check if table exists by trying to select a single row
      const { error: accessError } = await supabase
        .from('sessions')
        .select('id')
        .limit(1);

      if (accessError) {
        console.error('SESSION [SYNC] Sessions table not accessible:', accessError.message);
        console.error('SESSION [SYNC] Make sure to run create_sessions_table.sql in Supabase');
        return false;
      }

      const insertData = {
        user_id: session.userId,
        session_id: session.id,
        start_time: new Date(session.startTime).toISOString(),
        duration: 0,
        distance: 0,
        speed: 0,
        calories: 0,
        cycles: 0,
      };

      console.log('SESSION [SYNC] Inserting session data:', insertData);

      const { error } = await supabase
        .from('sessions')
        .insert(insertData);

      if (error) {
        console.error('SESSION [SYNC] Insert failed:', error.message);
        console.error('SESSION [SYNC] Error details:', error);
        return false;
      }

      console.log('SESSION [SYNC] Session saved successfully:', session.id);
      return true;
    } catch (error) {
      console.error('SESSION [SYNC] Start session error:', error);
      return false;
    }
  }

  /**
   * 2. DURING SESSION → UPDATE distance, calories, cycles, duration
   */
  static async updateSession(session: CyclingSession): Promise<boolean> {
    try {
      // Update session data

      const updateData = {
        duration: session.duration,
        distance: session.totalDistance,
        speed: session.maxSpeed,
        calories: session.totalCalories,
        cycles: session.totalCycles,
      };

      console.log('[SYNC] 📝 Updating with data:', updateData);

      const { data, error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('session_id', session.id)
        .select();

      if (error) {
        console.error('[SYNC] ❌ Update session failed:', error);
        console.error('[SYNC] ❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }

      console.log('[SYNC] ✅ Session updated in cloud:', {
        session_id: session.id,
        distance: session.totalDistance,
        rowsAffected: data?.length || 0,
        data: data,
      });
      
      if (!data || data.length === 0) {
        console.warn('[SYNC] ⚠️ No rows updated! Session might not exist in DB:', session.id);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SYNC] ❌ Update session error:', error);
      return false;
    }
  }

  /**
   * 3. SESSION ENDS → UPDATE end_time
   */
  static async endSession(session: CyclingSession): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: new Date(session.endTime || Date.now()).toISOString(),
          duration: session.duration,
          distance: session.totalDistance,
          speed: session.maxSpeed,
          calories: session.totalCalories,
          cycles: session.totalCycles,
        })
        .eq('session_id', session.id);

      if (error) {
        console.error('[SYNC] ❌ End session failed:', error);
        return false;
      }

      console.log('[SYNC] 🏁 Session ended in cloud:', session.id);
      return true;
    } catch (error) {
      console.error('[SYNC] ❌ End session error:', error);
      return false;
    }
  }

  /**
   * Get user's completed sessions from cloud (only sessions with distance > 0)
   */
  static async getUserSessions(userId: string): Promise<CyclingSession[]> {
    try {
      console.log('[SYNC] 📋 Fetching sessions for user:', userId);
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .gt('distance', 0) // Only sessions with distance > 0
        .order('start_time', { ascending: false });

      if (error) {
        console.error('[SYNC] ❌ Get sessions failed:', error);
        return [];
      }

      console.log('[SYNC] 📊 Found', data?.length || 0, 'sessions with distance > 0');

      // Convert to local format
      const sessions = data.map(row => ({
        id: row.session_id,
        userId: row.user_id,
        startTime: new Date(row.start_time).getTime(),
        endTime: row.end_time ? new Date(row.end_time).getTime() : undefined,
        duration: row.duration,
        totalDistance: parseFloat(row.distance),
        totalCalories: row.calories,
        totalCycles: row.cycles,
        maxSpeed: parseFloat(row.speed),
        avgSpeed: parseFloat(row.speed),
        isCompleted: true,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.created_at).getTime(),
        isSynced: true,
        notes: '',
      }));

      console.log('[SYNC] ✅ Converted sessions:', sessions.map(s => ({
        id: s.id,
        distance: s.totalDistance,
        duration: s.duration,
        date: new Date(s.startTime).toLocaleDateString()
      })));

      return sessions;
    } catch (error) {
      console.error('[SYNC] ❌ Get sessions error:', error);
      return [];
    }
  }
}
