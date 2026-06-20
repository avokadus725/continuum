-- Allow all authenticated users to view any profile.
-- Required for: leaderboard, community post authors, comment authors,
--               avatar display throughout the app.
-- The profiles table contains only public information: full_name, avatar_url,
-- xp, level, bio, language – no email or sensitive auth data.

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
