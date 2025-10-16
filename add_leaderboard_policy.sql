-- ============================================================================
-- ADD PUBLIC READ POLICY FOR LEADERBOARD
-- ============================================================================
-- Run this in your Supabase SQL Editor to allow public read access for leaderboard
-- This will enable the leaderboard to show top players from all users
-- Add public read policy for leaderboard functionality
CREATE POLICY "Public can view sessions for leaderboard" ON public.sessions FOR
SELECT USING (true);
-- Add public read policy for users table (for usernames in leaderboard)
-- Note: Run create_users_table.sql first if you haven't already!
CREATE POLICY "Public can view users for leaderboard" ON public.users FOR
SELECT USING (true);
-- ============================================================================
-- LEADERBOARD QUERY EXAMPLES
-- ============================================================================
-- These are the queries the app will use to fetch leaderboard data
-- 1. Top 5 by Total Distance (aggregated across all sessions per user)
/*
 SELECT 
 user_id,
 SUM(distance) as total_distance,
 SUM(calories) as total_calories,
 COUNT(*) as total_sessions,
 MAX(speed) as best_speed,
 ROW_NUMBER() OVER (ORDER BY SUM(distance) DESC) as rank
 FROM public.sessions 
 WHERE distance > 0 
 GROUP BY user_id 
 ORDER BY total_distance DESC 
 LIMIT 5;
 */
-- 2. Top 5 by Total Calories (aggregated across all sessions per user)
/*
 SELECT 
 user_id,
 SUM(distance) as total_distance,
 SUM(calories) as total_calories,
 COUNT(*) as total_sessions,
 MAX(speed) as best_speed,
 ROW_NUMBER() OVER (ORDER BY SUM(calories) DESC) as rank
 FROM public.sessions 
 WHERE calories > 0 
 GROUP BY user_id 
 ORDER BY total_calories DESC 
 LIMIT 5;
 */
-- 3. Top 5 by Best Speed (single session best speed per user)
/*
 SELECT 
 user_id,
 SUM(distance) as total_distance,
 SUM(calories) as total_calories,
 COUNT(*) as total_sessions,
 MAX(speed) as best_speed,
 ROW_NUMBER() OVER (ORDER BY MAX(speed) DESC) as rank
 FROM public.sessions 
 WHERE speed > 0 
 GROUP BY user_id 
 ORDER BY best_speed DESC 
 LIMIT 5;
 */
-- ============================================================================
-- TEST THE POLICY
-- ============================================================================
-- Test that the policy works by running this query (should work even when not authenticated):
-- SELECT user_id, distance, calories, speed FROM public.sessions LIMIT 5;