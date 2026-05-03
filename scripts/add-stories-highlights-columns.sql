-- Add stories and highlights JSON columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS posts_list JSONB DEFAULT '[]'::jsonb;

-- Add index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_profiles_stories ON profiles USING gin(stories);
CREATE INDEX IF NOT EXISTS idx_profiles_highlights ON profiles USING gin(highlights);
CREATE INDEX IF NOT EXISTS idx_profiles_posts_list ON profiles USING gin(posts_list);

-- Update the Profile interface in TypeScript to include these fields
-- This is just a SQL file, TypeScript updates need to be done separately