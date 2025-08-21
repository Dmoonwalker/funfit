-- FunFeet Database Schema for Supabase
-- Run this in your Supabase SQL editor
-- Enable Row Level Security (RLS)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create cycling_sessions table
CREATE TABLE IF NOT EXISTS public.cycling_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    total_distance INTEGER NOT NULL,
    -- in meters
    total_calories INTEGER NOT NULL,
    average_speed DECIMAL(5, 2) NOT NULL,
    -- km/h
    max_speed DECIMAL(5, 2) NOT NULL,
    -- km/h
    duration INTEGER NOT NULL,
    -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_distance INTEGER DEFAULT 0,
    -- in meters
    total_calories INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    average_speed DECIMAL(5, 2) DEFAULT 0,
    -- km/h
    max_speed DECIMAL(5, 2) DEFAULT 0,
    -- km/h
    total_duration INTEGER DEFAULT 0,
    -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cycling_sessions_user_id ON public.cycling_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cycling_sessions_created_at ON public.cycling_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR
INSERT WITH CHECK (auth.uid() = id);
-- Create RLS policies for cycling_sessions table
CREATE POLICY "Users can view own cycling sessions" ON public.cycling_sessions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cycling sessions" ON public.cycling_sessions FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cycling sessions" ON public.cycling_sessions FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cycling sessions" ON public.cycling_sessions FOR DELETE USING (auth.uid() = user_id);
-- Create RLS policies for user_stats table
CREATE POLICY "Users can view own stats" ON public.user_stats FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.user_stats FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.user_stats FOR
UPDATE USING (auth.uid() = user_id);
-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.users (id, email, username)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1)
        )
    );
-- Initialize user stats
INSERT INTO public.user_stats (user_id)
VALUES (NEW.id);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create trigger to automatically create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Create function to update user stats when cycling session is added
CREATE OR REPLACE FUNCTION public.update_user_stats_on_session() RETURNS TRIGGER AS $$ BEGIN -- Update user stats when cycling session is inserted
    IF TG_OP = 'INSERT' THEN
UPDATE public.user_stats
SET total_distance = total_distance + NEW.total_distance,
    total_calories = total_calories + NEW.total_calories,
    total_sessions = total_sessions + 1,
    total_duration = total_duration + NEW.duration,
    average_speed = CASE
        WHEN total_sessions = 0 THEN NEW.average_speed
        ELSE (
            average_speed * total_sessions + NEW.average_speed
        ) / (total_sessions + 1)
    END,
    max_speed = GREATEST(max_speed, NEW.max_speed),
    updated_at = NOW()
WHERE user_id = NEW.user_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create trigger to update user stats when cycling session is added
CREATE OR REPLACE TRIGGER on_cycling_session_insert
AFTER
INSERT ON public.cycling_sessions FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_on_session();
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon,
    authenticated;
GRANT ALL ON public.users TO anon,
    authenticated;
GRANT ALL ON public.cycling_sessions TO anon,
    authenticated;
GRANT ALL ON public.user_stats TO anon,
    authenticated;
GRANT USAGE ON SEQUENCE public.cycling_sessions_id_seq TO anon,
    authenticated;
GRANT USAGE ON SEQUENCE public.user_stats_id_seq TO anon,
    authenticated;