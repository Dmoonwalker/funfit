-- ============================================================================
-- CREATE NEW SESSIONS TABLE
-- ============================================================================
-- Run this in your Supabase SQL Editor to create a fresh sessions table
-- Note: UUID primary keys don't need sequences, they auto-generate
-- Drop existing table if it exists
DROP TABLE IF EXISTS public.sessions CASCADE;
-- Create the sessions table
CREATE TABLE public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration BIGINT NOT NULL DEFAULT 0,
    -- Duration in milliseconds
    distance DECIMAL(8, 2) NOT NULL DEFAULT 0,
    speed DECIMAL(5, 2) NOT NULL DEFAULT 0,
    calories INTEGER NOT NULL DEFAULT 0,
    cycles INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX idx_sessions_start_time ON public.sessions(start_time);
-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
-- Create RLS Policies (Fixed to handle TEXT user_id properly)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
-- Create new policies with proper type casting
CREATE POLICY "Users can view own sessions" ON public.sessions FOR
SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR
INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own sessions" ON public.sessions FOR
UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING (auth.uid()::text = user_id);
-- Grant permissions
GRANT ALL ON public.sessions TO anon,
    authenticated;
-- ============================================================================
-- TEST THE TABLE
-- ============================================================================
-- Test queries you can run in Supabase SQL Editor:
-- 1. Check table exists and structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'sessions' AND table_schema = 'public'
-- ORDER BY ordinal_position;
-- 2. Check RLS policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'sessions';
-- 3. Test insert (replace with real user_id):
-- INSERT INTO public.sessions (user_id, session_id, start_time, duration, distance, speed, calories, cycles)
-- VALUES ('08985e38-e0c7-448f-8b61-ac71615a13e4', 'test-session-123', NOW(), 1000, 2.5, 15.5, 25, 150);
-- 4. Test select:
-- SELECT * FROM public.sessions LIMIT 5;
-- 5. Check permissions:
-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_name = 'sessions';