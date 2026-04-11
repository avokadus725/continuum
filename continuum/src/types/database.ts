export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          condition: Json | null
          description: string
          icon: string | null
          id: string
          title: string
          xp_reward: number
        }
        Insert: {
          condition?: Json | null
          description: string
          icon?: string | null
          id?: string
          title: string
          xp_reward?: number
        }
        Update: {
          condition?: Json | null
          description?: string
          icon?: string | null
          id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      collection_materials: {
        Row: {
          added_at: string
          collection_id: string
          material_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          material_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_materials_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          material_id: string | null
          parent_id: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          material_id?: string | null
          parent_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          material_id?: string | null
          parent_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          title: string
          topic_id: string | null
          type: Database["public"]["Enums"]["material_type"]
          updated_at: string
          url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          title: string
          topic_id?: string | null
          type?: Database["public"]["Enums"]["material_type"]
          updated_at?: string
          url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          title?: string
          topic_id?: string | null
          type?: Database["public"]["Enums"]["material_type"]
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          material_id: string | null
          task_id: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          material_id?: string | null
          task_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          material_id?: string | null
          task_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          meta: Json | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          meta?: Json | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          meta?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string
          level: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string
          level?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          level?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          material_id: string | null
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          material_id?: string | null
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          material_id?: string | null
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          answer: string | null
          attempt_num: number
          completed_at: string
          id: string
          is_correct: boolean
          score: number
          task_id: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          attempt_num?: number
          completed_at?: string
          id?: string
          is_correct: boolean
          score?: number
          task_id: string
          user_id: string
        }
        Update: {
          answer?: string | null
          attempt_num?: number
          completed_at?: string
          id?: string
          is_correct?: boolean
          score?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_options: {
        Row: {
          id: string
          is_correct: boolean
          order_num: number
          task_id: string
          text: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          order_num?: number
          task_id: string
          text: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          order_num?: number
          task_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_options_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          is_published: boolean
          title: string
          topic_id: string | null
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          is_published?: boolean
          title: string
          topic_id?: string | null
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          is_published?: boolean
          title?: string
          topic_id?: string | null
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty: "beginner" | "intermediate" | "advanced"
      material_type: "article" | "video" | "link" | "interactive"
      notification_type: "new_task" | "achievement" | "recommendation" | "comment_reply"
      reaction_type: "like" | "helpful" | "fire"
      task_type: "single_choice" | "multiple_choice" | "text" | "code"
      user_role: "student" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
