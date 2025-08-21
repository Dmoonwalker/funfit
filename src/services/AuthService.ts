/**
 * @fileoverview Authentication Service for FunFeet Cycling App
 * 
 * This service handles all authentication operations using Supabase as the backend.
 * It provides user registration, login, logout, and session management capabilities.
 * 
 * Features:
 * - User registration (sign up)
 * - User authentication (sign in)
 * - Session management and logout
 * - Real-time authentication state monitoring
 * - Error handling and logging
 * 
 * The service uses Supabase Auth for secure authentication and integrates
 * with the app's user management system.
 * 
 * @author FunFeet Development Team
 * @version 1.0.0
 * @since 2024
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

/**
 * Supabase project URL
 * This is the endpoint for the Supabase project hosting the authentication service
 */
const supabaseUrl = 'https://uvcwmvnapuivacarkdbd.supabase.co';

/**
 * Supabase anonymous key
 * This key is used for client-side authentication operations
 * It's safe to expose in client code as it has limited permissions
 */
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Y3dtdm5hcHVpdmFjYXJrZGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzY3NTAsImV4cCI6MjA3MDA1Mjc1MH0.c_2Xp02ONjHk94vpxOM6B2T5f0d166JnVUJDuX0VP68';

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

/**
 * Result of authentication operations
 * Contains success status and optional error information
 */
export interface AuthResult {
  /** Whether the authentication operation was successful */
  success: boolean;
  /** Error message if the operation failed */
  error?: string;
}

// ============================================================================
// AUTH SERVICE CLASS
// ============================================================================

/**
 * Authentication Service Class
 * 
 * Provides a complete interface for user authentication using Supabase.
 * Handles user registration, login, logout, and session management.
 * 
 * This service is implemented as a singleton to ensure consistent
 * authentication state across the application.
 * 
 * @example
 * ```typescript
 * // Sign up a new user
 * const result = await authService.signUp('user@example.com', 'password123');
 * if (result.success) {
 *   console.log('User registered successfully');
 * }
 * 
 * // Sign in an existing user
 * const loginResult = await authService.signIn('user@example.com', 'password123');
 * if (loginResult.success) {
 *   console.log('User logged in successfully');
 * }
 * ```
 */
class AuthService {
  // ============================================================================
  // PRIVATE PROPERTIES
  // ============================================================================

  /** Supabase client instance for authentication operations */
  private supabase: any = null;

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Gets or creates the Supabase client instance
   * Implements lazy initialization to ensure the client is only created when needed
   * 
   * @returns Supabase client instance
   * 
   * @example
   * ```typescript
   * const supabase = this.getSupabase();
   * const { data, error } = await supabase.auth.signUp({...});
   * ```
   */
  private getSupabase() {
    if (!this.supabase) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    return this.supabase;
  }

  // ============================================================================
  // PUBLIC METHODS - AUTHENTICATION OPERATIONS
  // ============================================================================

  /**
   * Registers a new user account
   * 
   * Creates a new user account with the provided email and password.
   * The user will receive a confirmation email to verify their account.
   * 
   * @param email - User's email address (must be valid format)
   * @param password - User's password (must meet security requirements)
   * @returns Promise<AuthResult> - Result of the registration operation
   * 
   * @example
   * ```typescript
   * const result = await authService.signUp('john@example.com', 'SecurePass123!');
   * if (result.success) {
   *   console.log('Registration successful');
   * } else {
   *   console.error('Registration failed:', result.error);
   * }
   * ```
   * 
   * @throws May throw errors for network issues or invalid Supabase configuration
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 AuthService: Starting sign up for:', email);
      
      // Attempt to create the user account
      const { error } = await this.getSupabase().auth.signUp({
        email,
        password
      });

      console.log('🔐 AuthService: Sign up response error:', error);

      // Check if there was an error during registration
      if (error) {
        console.error('🔐 AuthService: Sign up failed with error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('🔐 AuthService: Sign up successful');
      return { success: true };
    } catch (error) {
      console.error('🔐 AuthService: Unexpected error during sign up:', error);
      return { success: false, error: 'Sign up failed' };
    }
  }

  /**
   * Authenticates an existing user
   * 
   * Signs in a user with their email and password credentials.
   * Creates a session that persists until the user logs out or the session expires.
   * 
   * @param email - User's registered email address
   * @param password - User's password
   * @returns Promise<AuthResult> - Result of the authentication operation
   * 
   * @example
   * ```typescript
   * const result = await authService.signIn('john@example.com', 'SecurePass123!');
   * if (result.success) {
   *   console.log('Login successful');
   *   // User is now authenticated
   * } else {
   *   console.error('Login failed:', result.error);
   * }
   * ```
   * 
   * @throws May throw errors for network issues or invalid credentials
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 AuthService: Starting sign in for:', email);
      
      // Attempt to authenticate the user
      const { error } = await this.getSupabase().auth.signInWithPassword({
        email,
        password
      });

      console.log('🔐 AuthService: Sign in response error:', error);

      // Check if there was an error during authentication
      if (error) {
        console.error('🔐 AuthService: Sign in failed with error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('🔐 AuthService: Sign in successful');
      return { success: true };
    } catch (error) {
      console.error('🔐 AuthService: Unexpected error during sign in:', error);
      return { success: false, error: 'Sign in failed' };
    }
  }

  /**
   * Signs out the current user
   * 
   * Ends the current user session and clears authentication state.
   * The user will need to sign in again to access protected features.
   * 
   * @returns Promise<void> - Resolves when logout is complete
   * 
   * @example
   * ```typescript
   * await authService.signOut();
   * console.log('User signed out successfully');
   * // User is now logged out and session is cleared
   * ```
   * 
   * @throws May throw errors for network issues
   */
  async signOut(): Promise<void> {
    await this.getSupabase().auth.signOut();
  }

  // ============================================================================
  // PUBLIC METHODS - SESSION MANAGEMENT
  // ============================================================================

  /**
   * Gets the current authenticated user
   * 
   * Retrieves information about the currently signed-in user.
   * Returns null if no user is authenticated.
   * 
   * @returns Promise containing user information or null
   * 
   * @example
   * ```typescript
   * const { data: { user }, error } = await authService.getCurrentUser();
   * if (user) {
   *   console.log('Current user:', user.email);
   * } else {
   *   console.log('No user is currently signed in');
   * }
   * ```
   */
  getCurrentUser() {
    return this.getSupabase().auth.getUser();
  }

  /**
   * Sets up authentication state change listener
   * 
   * Registers a callback function that will be called whenever the
   * authentication state changes (login, logout, session refresh, etc.).
   * 
   * @param callback - Function to call when auth state changes
   * @param callback.event - Type of auth event ('SIGNED_IN', 'SIGNED_OUT', etc.)
   * @param callback.session - Current session data or null
   * @returns Subscription object that can be used to unsubscribe
   * 
   * @example
   * ```typescript
   * const subscription = authService.onAuthStateChange((event, session) => {
   *   if (event === 'SIGNED_IN') {
   *     console.log('User signed in:', session?.user?.email);
   *   } else if (event === 'SIGNED_OUT') {
   *     console.log('User signed out');
   *   }
   * });
   * 
   * // Later, to unsubscribe:
   * subscription.data.subscription.unsubscribe();
   * ```
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.getSupabase().auth.onAuthStateChange(callback);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton instance of the AuthService
 * 
 * This ensures that there's only one authentication service instance
 * throughout the application, maintaining consistent state.
 * 
 * @example
 * ```typescript
 * import { authService } from './services/AuthService';
 * 
 * // Use the service directly
 * const result = await authService.signIn('user@example.com', 'password');
 * ```
 */
export const authService = new AuthService(); 