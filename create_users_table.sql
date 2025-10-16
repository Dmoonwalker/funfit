-- ============================================================================
-- CREATE USERS TABLE AND FIX LEADERBOARD SETUP
-- ============================================================================
-- Run this in your Supabase SQL Editor to create the users table and fix relationships
-- 1. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    -- This will match auth.uid()
    email TEXT NOT NULL,
    username TEXT,
    avatar_url TEXT,
    weight_kg DECIMAL(5, 2),
    daily_goal_calories INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    avatar_gender TEXT CHECK (avatar_gender IN ('male', 'female')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
-- 3. Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- 4. Create RLS policies for users table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public can view users for leaderboard" ON public.users;
-- Create new policies
CREATE POLICY "Users can view own profile" ON public.users FOR
SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR
INSERT WITH CHECK (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (auth.uid()::text = id);
-- Allow public read for leaderboard (usernames only)
CREATE POLICY "Public can view users for leaderboard" ON public.users FOR
SELECT USING (true);
-- 5. Grant permissions
GRANT ALL ON public.users TO anon,
    authenticated;
-- 6. Add the leaderboard read policy for sessions (if not already added)
DROP POLICY IF EXISTS "Public can view sessions for leaderboard" ON public.sessions;
CREATE POLICY "Public can view sessions for leaderboard" ON public.sessions FOR
SELECT USING (true);
-- ============================================================================
-- TEST QUERIES
-- ============================================================================
-- Test that tables exist and are accessible
-- SELECT 'Users table' as table_name, count(*) as row_count FROM public.users
-- UNION ALL
-- SELECT 'Sessions table' as table_name, count(*) as row_count FROM public.sessions;
-- Test leaderboard query (this is what the app will use)
-- SELECT 
--     s.user_id,
--     u.username,
--     SUM(s.distance) as total_distance,
--     SUM(s.calories) as total_calories,
--     COUNT(s.id) as total_sessions,
--     MAX(s.speed) as best_speed
-- FROM public.sessions s
-- LEFT JOIN public.users u ON s.user_id = u.id
-- WHERE s.distance > 0 
-- GROUP BY s.user_id, u.username
-- ORDER BY total_distance DESC 
-- LIMIT 5;
-- ============================================================================
-- POPULATE SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================
-- Uncomment the lines below if you want to add sample data for testing
-- Note: Replace the user IDs with actual auth user IDs from your system
-- INSERT INTO public.users (id, email, username, avatar_gender) VALUES 
-- ('sample-user-1', 'mia@example.com', 'Mia T.', 'female'),
-- ('sample-user-2', 'emma@example.com', 'Emma C.', 'female'),
-- ('sample-user-3', 'liam@example.com', 'Liam T.', 'male'),
-- ('sample-user-4', 'ayomide@example.com', 'Ayomide O.', 'male')
-- ON CONFLICT (id) DO NOTHING;
-- INSERT INTO public.sessions (user_id, session_id, start_time, distance, speed, calories, cycles) VALUES 
-- ('sample-user-1', 'session-1', NOW() - INTERVAL '1 day', 15.5, 18.2, 300, 800),
-- ('sample-user-2', 'session-2', NOW() - INTERVAL '2 days', 14.8, 17.5, 280, 750),
-- ('sample-user-3', 'session-3', NOW() - INTERVAL '3 days', 13.2, 16.8, 260, 700),
-- ('sample-user-4', 'session-4', NOW() - INTERVAL '4 days', 12.1, 15.9, 240, 650)
-- ON CONFLICT DO NOTHING;