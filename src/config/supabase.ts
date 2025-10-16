import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://jkdustwjmtvtpxyofkpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZHVzdHdqbXR2dHB4eW9ma3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODU4NDQsImV4cCI6MjA3NTA2MTg0NH0.FAOsp_HSl6qbInWEHnA9V14TwuS4loJ4VqSsh_2svFg';
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for session persistence
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
}); 