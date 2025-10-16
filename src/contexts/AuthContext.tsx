/**
 * @fileoverview Simplified Authentication Context for FunFeet Cycling App
 *
 * Provides basic authentication state management without complex profile logic.
 *
 * @author FunFeet Development Team
 * @version 3.0.0
 * @since 2024
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AuthService, UserProfile } from '../services/AuthService';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'auth_current_user_id',
  ONBOARDING_COMPLETED: 'auth_onboarding_completed',
  USER_PROFILE: 'auth_user_profile',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

export interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isOnboardingCompleted: boolean;
  currentUserId: string;

  // Methods
  signUp: (data: SignUpData) => Promise<AuthResult>;
  signIn: (data: SignInData) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  completeOnboarding: (data: { weight_kg: number; daily_goal_km: number; gender: 'male' | 'female'; avatar_gender: 'male' | 'female'; onboarding_completed: boolean }) => Promise<boolean>;
  refreshSession: () => Promise<AuthResult>;
  initializeGuest: () => Promise<string>;
  refreshUserProfile: () => Promise<void>;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [onboardingJustCompleted, setOnboardingJustCompleted] = useState(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isAuthenticated = !!user;
  const isGuest = !isAuthenticated;

  // ============================================================================
  // STORAGE HELPER METHODS
  // ============================================================================

  /**
   * Save auth state to AsyncStorage
   */
  const saveAuthState = async (userId: string, onboardingCompleted: boolean, profile: UserProfile | null) => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.CURRENT_USER_ID, userId],
        [STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(onboardingCompleted)],
        [STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile)],
      ]);
      console.log('💾 [AUTH] Auth state saved to storage');
    } catch (error) {
      console.error('❌ [AUTH] Failed to save auth state:', error);
    }
  };

  /**
   * Restore auth state from AsyncStorage
   */
  const restoreAuthState = async () => {
    try {
      const [[, userId], [, onboardingCompleted], [, profile]] = await AsyncStorage.multiGet([
        STORAGE_KEYS.CURRENT_USER_ID,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.USER_PROFILE,
      ]);

      return {
        userId: userId || '',
        onboardingCompleted: onboardingCompleted ? JSON.parse(onboardingCompleted) : false,
        profile: profile ? JSON.parse(profile) : null,
      };
    } catch (error) {
      console.error('❌ [AUTH] Failed to restore auth state:', error);
      return { userId: '', onboardingCompleted: false, profile: null };
    }
  };

  /**
   * Clear auth state from AsyncStorage
   */
  const clearAuthState = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CURRENT_USER_ID,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.USER_PROFILE,
      ]);
      console.log('🗑️ [AUTH] Auth state cleared from storage');
    } catch (error) {
      console.error('❌ [AUTH] Failed to clear auth state:', error);
    }
  };

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if user has completed onboarding by verifying all required fields are filled
   * (gender, avatar_gender, weight_kg, daily_goal_km)
   */
  const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
    console.log('ONBOARDING [CONTEXT] 🔍 Checking onboarding status for user:', userId);

    try {
      console.log('ONBOARDING [CONTEXT] 🗃️ Querying database for required onboarding fields...');

      const { data, error } = await supabase
        .from('users')
        .select('gender, avatar_gender, weight_kg, daily_goal_km')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('ONBOARDING [CONTEXT] ❌ Check onboarding status database error:', error);
        console.error('ONBOARDING [CONTEXT] ❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setIsOnboardingCompleted(false);
        return false;
      }

      // Check if all required onboarding fields are filled
      const hasGender = Boolean(data?.gender && (data.gender === 'male' || data.gender === 'female'));
      const hasAvatarGender = Boolean(data?.avatar_gender && (data.avatar_gender === 'male' || data.avatar_gender === 'female'));
      const hasWeight = Boolean(data?.weight_kg && data.weight_kg > 0);
      const hasDailyGoal = Boolean(data?.daily_goal_km && data.daily_goal_km > 0);

      const completed = hasGender && hasAvatarGender && hasWeight && hasDailyGoal;
      
      console.log('ONBOARDING [CONTEXT] 📋 Database response:', data);
      console.log('ONBOARDING [CONTEXT] 📋 Field validation:', {
        hasGender,
        hasAvatarGender,
        hasWeight,
        hasDailyGoal,
        completed
      });
      console.log('ONBOARDING [CONTEXT] ✅ Onboarding status for user', userId, ':', completed);

      setIsOnboardingCompleted(completed);
      console.log('ONBOARDING [CONTEXT] 🔄 Local state updated to:', completed);

      return completed;
    } catch (error) {
      console.error('ONBOARDING [CONTEXT] 💥 Check onboarding status exception:', error);
      console.error('ONBOARDING [CONTEXT] 💥 Exception details:', error instanceof Error ? error.message : error);
      setIsOnboardingCompleted(false);
      return false;
    }
  };

  // ============================================================================
  // METHODS
  // ============================================================================

  /**
   * Generate a guest user ID
   */
  const generateGuestUserId = (): string => {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Initialize guest user
   */
  const initializeGuest = useCallback(async (): Promise<string> => {
    const guestUserId = generateGuestUserId();
    setCurrentUserId(guestUserId);
    return guestUserId;
  }, []);

  /**
   * Sign up a new user
   */
  const signUp = async (data: SignUpData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await AuthService.signUp(data);

      if (result.success && result.user) {
        setUser(result.user);
        setSession(result.session || null);
        setCurrentUserId(result.user.id);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in existing user
   */
  const signIn = async (data: SignInData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await AuthService.signIn(data);

      if (result.success && result.user) {
        setUser(result.user);
        setSession(result.session || null);
        setCurrentUserId(result.user.id);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      console.log('🔐 Starting logout process...');

      // Create new guest user before signing out
      const guestUserId = generateGuestUserId();
      setCurrentUserId(guestUserId);

      // Clear saved auth state
      await clearAuthState();

      // Sign out from authentication
      const result = await AuthService.signOut();

      if (result.success) {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setIsOnboardingCompleted(false);
        setOnboardingJustCompleted(false);
        console.log('✅ Logout completed successfully');
      }

      return result;
    } catch (error) {
      console.error('❌ Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Complete user onboarding
   */
  const completeOnboarding = async (data: { weight_kg: number; daily_goal_km: number; gender: 'male' | 'female'; avatar_gender: 'male' | 'female'; onboarding_completed: boolean }): Promise<boolean> => {
    console.log('ONBOARDING [CONTEXT] 🎯 completeOnboarding called with:', data);

    if (!user) {
      console.error('ONBOARDING [CONTEXT] ❌ No user available for onboarding completion');
      return false;
    }

    console.log('ONBOARDING [CONTEXT] 👤 Completing onboarding for user:', user.id);
    console.log('ONBOARDING [CONTEXT] 📤 Calling AuthService.completeOnboarding...');

    const success = await AuthService.completeOnboarding(user.id, data);
    console.log('ONBOARDING [CONTEXT] 📥 AuthService.completeOnboarding result:', success);

    if (success) {
      console.log('ONBOARDING [CONTEXT] ✅ Onboarding completed, updating local state to true');
      setIsOnboardingCompleted(true);
      setOnboardingJustCompleted(true);
      
      // Reset the flag after a short delay to allow normal profile refreshes
      setTimeout(() => {
        setOnboardingJustCompleted(false);
      }, 5000); // 5 seconds protection window
    } else {
      console.log('ONBOARDING [CONTEXT] ❌ AuthService.completeOnboarding failed');
    }

    console.log('ONBOARDING [CONTEXT] 🔚 completeOnboarding method finished');
    return success;
  };

  /**
   * Refresh current session
   */
  const refreshSession = async (): Promise<AuthResult> => {
    const result = await AuthService.refreshSession();

    if (result.success) {
      setUser(result.user || null);
      setSession(result.session || null);
    }

    return result;
  };

  // ============================================================================
  // AUTH STATE INITIALIZATION
  // ============================================================================

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');

        // Get initial session
        const initialSession = await AuthService.getCurrentSession();

        if (initialSession?.user) {
          console.log('✅ Found existing session for user:', initialSession.user.id);
          setUser(initialSession.user);
          setSession(initialSession);
          setCurrentUserId(initialSession.user.id);
          
          // Restore saved auth state or check fresh from database
          const savedState = await restoreAuthState();
          if (savedState.userId === initialSession.user.id && savedState.profile) {
            console.log('💾 [AUTH] Restored auth state from storage');
            setIsOnboardingCompleted(savedState.onboardingCompleted);
            setUserProfile(savedState.profile);
          } else {
            console.log('🔍 [AUTH] Checking fresh onboarding status');
            await checkOnboardingStatus(initialSession.user.id);
          }
        } else {
          console.log('👤 No existing session, initializing as guest');
          await initializeGuest();
        }

        // Setup auth state listener
        unsubscribe = AuthService.setupAuthListener(
          async (newUser, newSession) => {
            console.log('🔐 Auth state changed:', {
              userId: newUser?.id,
              hasSession: !!newSession
            });

            setUser(newUser || null);
            setSession(newSession || null);

            if (newUser) {
              setCurrentUserId(newUser.id);
              // Check onboarding status when user signs in
              await checkOnboardingStatus(newUser.id);
            } else {
              // User signed out, clear saved auth state and create new guest
              await clearAuthState();
              const guestUserId = generateGuestUserId();
              setCurrentUserId(guestUserId);
              setIsOnboardingCompleted(false);
              setUserProfile(null);
            }
          }
        );
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        await initializeGuest();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initializeGuest]);

  // ============================================================================
  // USER PROFILE MANAGEMENT
  // ============================================================================

  const refreshUserProfile = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      const profile = await AuthService.getUserProfile(currentUserId);
      setUserProfile(profile);
      if (profile) {
        // Only update onboarding status if it wasn't just completed
        if (!onboardingJustCompleted) {
          // Check if all required onboarding fields are filled
          const hasGender = Boolean(profile.gender && (profile.gender === 'male' || profile.gender === 'female'));
          const hasAvatarGender = Boolean(profile.avatar_gender && (profile.avatar_gender === 'male' || profile.avatar_gender === 'female'));
          const hasWeight = Boolean(profile.weight_kg && profile.weight_kg > 0);
          const hasDailyGoal = Boolean(profile.daily_goal_km && profile.daily_goal_km > 0);
          
          const completed = hasGender && hasAvatarGender && hasWeight && hasDailyGoal;
          
          setIsOnboardingCompleted(completed);
          console.log('ONBOARDING [CONTEXT] 🔄 Updated onboarding status from profile fields:', {
            hasGender,
            hasAvatarGender,
            hasWeight,
            hasDailyGoal,
            completed
          });
        } else {
          console.log('ONBOARDING [CONTEXT] 🛡️ Skipping onboarding status update - just completed onboarding');
        }
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  }, [currentUserId, onboardingJustCompleted]);

  // Load user profile when user changes
  useEffect(() => {
    if (currentUserId) {
      refreshUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [currentUserId, refreshUserProfile]);

  // ============================================================================
  // SAVE AUTH STATE WHEN IT CHANGES
  // ============================================================================

  useEffect(() => {
    // Save auth state when user is authenticated and we have the required data
    if (user && currentUserId && !isLoading) {
      saveAuthState(currentUserId, isOnboardingCompleted, userProfile);
    }
  }, [user, currentUserId, isOnboardingCompleted, userProfile, isLoading]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AuthContextType = {
    // State
    user,
    session,
    userProfile,
    isLoading,
    isAuthenticated,
    isGuest,
    isOnboardingCompleted,
    currentUserId,

    // Methods
    signUp,
    signIn,
    signOut,
    completeOnboarding,
    refreshSession,
    initializeGuest,
    refreshUserProfile,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};