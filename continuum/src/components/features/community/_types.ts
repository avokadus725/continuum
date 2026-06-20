/* Shared community types – used across page, composer, post card, etc.
   Mirror DB enums; keep in sync with migration.sql. */

export type PostKind = 'discussion' | 'question' | 'share'

export const POST_KINDS: PostKind[] = ['discussion', 'question', 'share']

export interface PostAuthor {
  full_name: string | null
  avatar_url: string | null
}

export interface PostComment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  profiles: PostAuthor | null
}

export interface CommunityPost {
  id: string
  kind: PostKind
  title: string | null
  content: string
  url: string | null
  url_title: string | null
  created_at: string
  user_id: string
  is_solved: boolean
  profiles: PostAuthor | null
  tags: string[]
  comments: PostComment[]
  likes: number
  liked: boolean
  saved: boolean
}

export type FeedSort = 'recent' | 'top' | 'unsolved'
export type FeedKindFilter = 'all' | 'discussion' | 'question' | 'share'
