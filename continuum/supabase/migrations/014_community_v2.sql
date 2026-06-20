-- ─── Continuum Community v2 · Schema migration ──────────────
-- Run in Supabase SQL editor in order.

-- 1) Post kind + question metadata
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS kind       TEXT NOT NULL DEFAULT 'discussion'
        CHECK (kind IN ('discussion','question','share')),
  ADD COLUMN IF NOT EXISTS title      TEXT,
  ADD COLUMN IF NOT EXISTS is_solved  BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: posts with non-null url become 'share' kind retroactively.
UPDATE posts SET kind = 'share' WHERE url IS NOT NULL AND kind = 'discussion';

-- 2) Hashtags (normalised)
CREATE TABLE IF NOT EXISTS tags (
  slug         TEXT PRIMARY KEY,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id  UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_slug TEXT NOT NULL REFERENCES tags(slug) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_slug)
);
CREATE INDEX IF NOT EXISTS post_tags_tag_idx  ON post_tags(tag_slug);
CREATE INDEX IF NOT EXISTS post_tags_post_idx ON post_tags(post_id);

-- 3) Saved posts (bookmarks)
CREATE TABLE IF NOT EXISTS saved_posts (
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id  UUID NOT NULL REFERENCES posts(id)      ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- 4) Tag follow ("Стежити за темою")
CREATE TABLE IF NOT EXISTS tag_subscriptions (
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_slug TEXT NOT NULL REFERENCES tags(slug)     ON DELETE CASCADE,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag_slug)
);

-- 5) RLS – owners can manage own rows; everyone can read
ALTER TABLE tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags · readable to authenticated"
  ON tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tags · insertable by authenticated"
  ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "post_tags · readable to authenticated"
  ON post_tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "post_tags · author can write"
  ON post_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_tags.post_id AND posts.user_id = auth.uid())
  );

CREATE POLICY "saved_posts · owner only"
  ON saved_posts FOR ALL USING (user_id = auth.uid());

CREATE POLICY "tag_subscriptions · owner only"
  ON tag_subscriptions FOR ALL USING (user_id = auth.uid());
