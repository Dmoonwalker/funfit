/**
 * @fileoverview Simplified Authentication Service for FunFeet Cycling App
 * 
 * Provides basic authentication functionality using Supabase Auth:
 * - Email/password authentication
 * - Session management
 * - User profile management
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import { supabase } from '../config/supabase';
import { User, Session } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

/**
 * Sign up data interface
 */
export interface SignUpData {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
}

/**
 * Sign in data interface
 */
export interface SignInData {
  email: string;
  password: string;
}

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  // Profile fields for personalization
  weight_kg?: number;
  daily_goal_km?: number;
  daily_goal_calories?: number;
  gender?: 'male' | 'female' | 'other';
  avatar_gender?: 'male' | 'female';
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}


// ============================================================================
// AUTHENTICATION SERVICE CLASS
// ============================================================================

/**
 * AuthService - Main authentication service class
 * 
 * Handles all authentication operations including sign up, sign in,
 * social authentication, and user profile management.
 */
export class AuthService {
  
  // ==========================================================================
  // EMAIL/PASSWORD AUTHENTICATION
  // ==========================================================================
  
  /**
   * Sign up a new user with email and password
   * 
   * @param data - Sign up data containing email, password, and optional profile info
   * @returns Promise<AuthResult> - Authentication result with user and session
   */
  static async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      console.log('🔐 Starting sign up process for:', data.email);
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
          },
        },
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        return {
          success: false,
          error: error.message,
        };
      }
      
      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account',
        };
      }
      
      console.log('✅ Sign up successful, user created:', authData.user.id);
      
      // Ensure profile row exists with all signup data
      await this.ensureUserProfileExists(authData.user.id, data.email, data.username);
      
      // Guest data migration removed - keeping it simple
      
      return {
        success: true,
        user: authData.user,
        session: authData.session || undefined,
      };
      
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Sign in an existing user with email and password
   * 
   * @param data - Sign in data containing email and password
   * @returns Promise<AuthResult> - Authentication result with user and session
   */
  static async signIn(data: SignInData): Promise<AuthResult> {
    try {
      console.log('🔐 Starting sign in process for:', data.email);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        return {
          success: false,
          error: error.message,
        };
      }
      
      if (!authData.user || !authData.session) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }
      
      console.log('✅ Sign in successful:', authData.user.id);
      
      // Ensure profile row exists
      await this.ensureUserProfileExists(authData.user.id, data.email);
      
      // Guest data migration removed - keeping it simple
      
      // Data sync removed - cloud sync happens automatically every 5 seconds
      
      return {
        success: true,
        user: authData.user,
        session: authData.session,
      };
      
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Sign out the current user
   * 
   * @returns Promise<AuthResult> - Result of sign out operation
   */
  static async signOut(): Promise<AuthResult> {
    try {
      console.log('🔐 Starting sign out process');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        return {
          success: false,
          error: error.message,
        };
      }
      
      // User ID is managed in AuthContext state only
      
      console.log('✅ Sign out successful');
      
      return {
        success: true,
      };
      
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  
  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================
  
  /**
   * Get current authenticated user
   * 
   * @returns Promise<User | null> - Current user or null if not authenticated
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Get current user error:', error);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('❌ Get current user exception:', error);
      return null;
    }
  }
  
  /**
   * Get current session
   * 
   * @returns Promise<Session | null> - Current session or null if not authenticated
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Get current session error:', error);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('❌ Get current session exception:', error);
      return null;
    }
  }
  
  /**
   * Check if user is currently authenticated
   * 
   * @returns Promise<boolean> - True if authenticated, false otherwise
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }
  
  /**
   * Refresh the current session
   * 
   * @returns Promise<AuthResult> - Result of session refresh
   */
  static async refreshSession(): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Refresh session error:', error);
        return {
          success: false,
          error: error.message,
        };
      }
      
      return {
        success: true,
        user: data.user || undefined,
        session: data.session || undefined,
      };
      
    } catch (error) {
      console.error('❌ Refresh session exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  // ==========================================================================
  // USER PROFILE MANAGEMENT
  // ==========================================================================
  
  /**
   * Get user profile from database
   * 
   * @param userId - The user ID to fetch profile for
   * @returns Promise<UserProfile | null> - User profile or null if not found
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Get user profile error:', error);
        return null;
      }
      
      return data as UserProfile | null;
    } catch (error) {
      console.error('❌ Get user profile exception:', error);
      return null;
    }
  }
  
  /**
   * Test database connection and user table access
   */
  static async testDatabaseConnection(userId: string): Promise<void> {
    try {
      console.log('🧪 Testing database connection for user:', userId);
      
      // Test 1: Check if user exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (selectError) {
        console.error('❌ Select test failed:', selectError);
        return;
      }
      
      console.log('✅ User found in database:', existingUser);
      
      // Test 2: Try a simple update
      const { data: updateResult, error: updateError } = await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select();
        
      if (updateError) {
        console.error('❌ Update test failed:', updateError);
        return;
      }
      
      console.log('✅ Update test successful:', updateResult);
      
    } catch (error) {
      console.error('❌ Database test exception:', error);
    }
  }

  /**
   * Update user profile
   * 
   * @param userId - The user ID to update
   * @param updates - Partial profile updates
   * @returns Promise<boolean> - True if update successful, false otherwise
   */
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      console.log('🔄 Updating user profile:', { userId, updates });
      
      // Update only the provided fields
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      console.log('🗄️ Database update data:', updateData);
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error('❌ Update user profile error:', error);
        return false;
      }
      
      console.log('✅ User profile updated successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Update user profile exception:', error);
      return false;
    }
  }

  /**
   * Complete user onboarding
   *
   * @param userId - The user ID to complete onboarding for
   * @param data - Onboarding data (weight, daily goal, gender)
   * @returns Promise<boolean> - True if onboarding completed successfully, false otherwise
   */
  static async completeOnboarding(userId: string, data: {
    weight_kg: number;
    daily_goal_km: number;
    gender: 'male' | 'female';
    avatar_gender: 'male' | 'female';
    onboarding_completed: boolean;
  }): Promise<boolean> {
    console.log('ONBOARDING [SERVICE] 🎯 completeOnboarding called for user:', userId);
    console.log('ONBOARDING [SERVICE] 📝 Input data:', data);

    try {
      console.log('ONBOARDING [SERVICE] 🔄 Preparing database update...');

      const updateData = {
        weight_kg: data.weight_kg,
        daily_goal_km: data.daily_goal_km, // Store km value directly
        gender: data.gender,
        avatar_gender: data.avatar_gender, // Use selected avatar gender
        onboarding_completed: data.onboarding_completed,
        updated_at: new Date().toISOString(),
      };

      console.log('ONBOARDING [SERVICE] 💾 Database update data:', updateData);
      console.log('ONBOARDING [SERVICE] 🗃️ Updating user record in database...');

      const { data: result, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select();

      if (error) {
        console.error('ONBOARDING [SERVICE] ❌ Database update error:', error);
        console.error('ONBOARDING [SERVICE] ❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }

      console.log('ONBOARDING [SERVICE] ✅ Database update successful');
      console.log('ONBOARDING [SERVICE] 📋 Updated user data:', result);
      console.log('ONBOARDING [SERVICE] 🎉 Onboarding completed successfully for user:', userId);

      return true;
    } catch (error) {
      console.error('ONBOARDING [SERVICE] 💥 Complete onboarding exception:', error);
      console.error('ONBOARDING [SERVICE] 💥 Exception details:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  // ==========================================================================
  // AUTH STATE LISTENING
  // ==========================================================================
  
  /**
   * Setup authentication state listener
   * 
   * @param callback - Callback function to handle auth state changes
   * @returns Function to unsubscribe from auth state changes
   */
  static setupAuthListener(callback: (user: User | undefined, session: Session | undefined) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.id);
        
        try {
          switch (event) {
            case 'SIGNED_IN':
              // User ID managed in AuthContext
              break;
              
            case 'SIGNED_OUT':
              // User ID managed in AuthContext
              break;
              
            case 'TOKEN_REFRESHED':
              console.log('🔄 Auth token refreshed');
              break;
              
            case 'USER_UPDATED':
              console.log('👤 User profile updated');
              break;
          }
        } catch (error) {
          console.error('❌ Auth listener error:', error);
        }
        
        callback(session?.user || undefined, session || undefined);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }
  
  
  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================
  
  /**
   * Ensure a profile row exists in public.users for the given auth user
   * 
   * @param userId - User ID to ensure profile for
   * @param email - Email address (optional, will fetch from auth if not provided)
   * @param username - Username (optional, will generate from email if not provided)
   * @returns Promise<UserProfile | null> - Created or existing profile
   */
  private static async ensureUserProfileExists(userId: string, email?: string, username?: string): Promise<UserProfile | null> {
    try {
      // Get email from auth user if not provided
      let userEmail = email;
      if (!userEmail) {
        const { data: { user } } = await supabase.auth.getUser();
        userEmail = user?.email || 'unknown@example.com';
      }

      // First, check if user profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ ensureUserProfileExists fetch error:', fetchError);
        return null;
      }

      // If profile exists, return it without updating onboarding_completed
      if (existingProfile) {
        console.log('✅ User profile already exists, preserving onboarding status:', existingProfile.onboarding_completed);
        return existingProfile as UserProfile;
      }

      // Profile doesn't exist, create new one with onboarding_completed: false
      const profileData = {
        id: userId,
        email: userEmail,
        username: username ?? userEmail.split('@')[0],
        avatar_gender: 'male' as const,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: profile, error: insertError } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ ensureUserProfileExists insert error:', insertError);
        return null;
      }

      console.log('✅ New user profile created with onboarding_completed: false');
      return profile as UserProfile;
    } catch (error) {
      console.error('❌ ensureUserProfileExists exception:', error);
      return null;
    }
  }
  
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default AuthService;