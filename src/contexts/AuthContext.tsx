import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvcwmvnapuivacarkdbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Y3dtdm5hcHVpdmFjYXJrZGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzY3NTAsImV4cCI6MjA3MDA1Mjc1MH0.c_2Xp02ONjHk94vpxOM6B2T5f0d166JnVUJDuX0VP68';

interface AuthContextType {
  user: any;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    // Initialize Supabase client
    const client = createClient(supabaseUrl, supabaseKey);
    setSupabase(client);

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
      console.log('🔐 AuthContext: Starting sign up for:', email);
      
      const { error } = await supabase.auth.signUp({
        email,
        password
      });

      console.log('🔐 AuthContext: Sign up response error:', error);

      if (error) {
        console.error('🔐 AuthContext: Sign up failed with error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('🔐 AuthContext: Sign up successful');
      return { success: true };
    } catch (error) {
      console.error('🔐 AuthContext: Unexpected error during sign up:', error);
      return { success: false, error: 'Sign up failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
      console.log('🔐 AuthContext: Starting sign in for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('🔐 AuthContext: Sign in response error:', error);

      if (error) {
        console.error('🔐 AuthContext: Sign in failed with error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('🔐 AuthContext: Sign in successful');
      return { success: true };
    } catch (error) {
      console.error('🔐 AuthContext: Unexpected error during sign in:', error);
      return { success: false, error: 'Sign in failed' };
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 