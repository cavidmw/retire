-- RLS Policies for posts table
-- Run this in Supabase SQL Editor

-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Public can read posts" ON posts;
DROP POLICY IF EXISTS "Service role can insert posts" ON posts;
DROP POLICY IF EXISTS "Service role can update posts" ON posts;
DROP POLICY IF EXISTS "Service role can delete posts" ON posts;

-- Allow public (anonymous) users to SELECT only
CREATE POLICY "Public can read posts"
ON posts
FOR SELECT
TO public
USING (true);

-- Only service_role can INSERT (admin API uses service role key)
CREATE POLICY "Service role can insert posts"
ON posts
FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service_role can UPDATE
CREATE POLICY "Service role can update posts"
ON posts
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Only service_role can DELETE
CREATE POLICY "Service role can delete posts"
ON posts
FOR DELETE
TO service_role
USING (true);

-- Note: The admin API routes use supabaseService (service_role key),
-- which bypasses RLS. But these policies ensure that if someone
-- tries to use the anon key directly, they can only SELECT.
