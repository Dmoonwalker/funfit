-- ============================================================================
-- ADD DAILY_GOAL_KM COLUMN TO USERS TABLE
-- ============================================================================
-- Run this in your Supabase SQL Editor to add the daily_goal_km column
-- Add the daily_goal_km column if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS daily_goal_km DECIMAL(5, 2);
-- Add a comment to the column
COMMENT ON COLUMN public.users.daily_goal_km IS 'User daily goal in kilometers';
-- Update existing records to populate daily_goal_km from daily_goal_calories if they exist
UPDATE public.users
SET daily_goal_km = daily_goal_calories / 40.0
WHERE daily_goal_calories IS NOT NULL
    AND daily_goal_km IS NULL;
-- Verify the changes
SELECT id,
    username,
    daily_goal_km,
    daily_goal_calories,
    CASE
        WHEN daily_goal_km IS NOT NULL THEN daily_goal_km * 40
        ELSE daily_goal_calories
    END as calculated_calories
FROM public.users
WHERE daily_goal_km IS NOT NULL
    OR daily_goal_calories IS NOT NULL
LIMIT 10;