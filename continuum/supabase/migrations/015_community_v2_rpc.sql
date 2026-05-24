-- Optional RPC functions for the right-rail.
-- The community page works without them (uses fallback approximations),
-- but these are faster + more accurate. Run after migration.sql.

CREATE OR REPLACE FUNCTION community_trending_tags(limit_n int DEFAULT 6)
RETURNS TABLE (slug text, posts bigint, trend int)
LANGUAGE sql STABLE
AS $$
  WITH last30 AS (
    SELECT pt.tag_slug, count(*) AS c
    FROM post_tags pt
    JOIN posts p ON p.id = pt.post_id
    WHERE p.created_at > now() - interval '30 days'
    GROUP BY pt.tag_slug
  ),
  last7 AS (
    SELECT pt.tag_slug, count(*) AS c
    FROM post_tags pt
    JOIN posts p ON p.id = pt.post_id
    WHERE p.created_at > now() - interval '7 days'
    GROUP BY pt.tag_slug
  )
  SELECT
    l30.tag_slug                                AS slug,
    l30.c                                        AS posts,
    coalesce(l7.c, 0)::int                       AS trend
  FROM last30 l30
  LEFT JOIN last7 l7 ON l7.tag_slug = l30.tag_slug
  ORDER BY l30.c DESC
  LIMIT limit_n;
$$;

CREATE OR REPLACE FUNCTION community_active_in_tag(tag text, limit_n int DEFAULT 4)
RETURNS TABLE (id uuid, name text, posts bigint, "avatarUrl" text)
LANGUAGE sql STABLE
AS $$
  SELECT
    pr.id                AS id,
    pr.full_name         AS name,
    count(*)             AS posts,
    pr.avatar_url        AS "avatarUrl"
  FROM posts p
  JOIN post_tags pt ON pt.post_id = p.id
  JOIN profiles pr  ON pr.id      = p.user_id
  WHERE pt.tag_slug = tag
  GROUP BY pr.id, pr.full_name, pr.avatar_url
  ORDER BY posts DESC
  LIMIT limit_n;
$$;

-- Allow authenticated users to call these:
GRANT EXECUTE ON FUNCTION community_trending_tags(int)              TO authenticated;
GRANT EXECUTE ON FUNCTION community_active_in_tag(text, int)         TO authenticated;
