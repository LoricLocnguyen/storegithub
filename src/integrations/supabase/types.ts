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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_tools: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          discord_url: string | null
          features: string | null
          github_url: string | null
          id: string
          logo_url: string | null
          name: string
          popularity: string | null
          pricing: string | null
          status: string
          twitter_url: string | null
          use_cases: string | null
          website_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          features?: string | null
          github_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          popularity?: string | null
          pricing?: string | null
          status?: string
          twitter_url?: string | null
          use_cases?: string | null
          website_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          features?: string | null
          github_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          popularity?: string | null
          pricing?: string | null
          status?: string
          twitter_url?: string | null
          use_cases?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      airdrop_projects: {
        Row: {
          blockchain: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          discord_url: string | null
          end_date: string | null
          estimated_value: string | null
          funding: string | null
          guide: string | null
          id: string
          logo_url: string | null
          name: string
          start_date: string | null
          status: string
          twitter_url: string | null
          website_url: string | null
        }
        Insert: {
          blockchain?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          discord_url?: string | null
          end_date?: string | null
          estimated_value?: string | null
          funding?: string | null
          guide?: string | null
          id?: string
          logo_url?: string | null
          name: string
          start_date?: string | null
          status?: string
          twitter_url?: string | null
          website_url?: string | null
        }
        Update: {
          blockchain?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          discord_url?: string | null
          end_date?: string | null
          estimated_value?: string | null
          funding?: string | null
          guide?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          start_date?: string | null
          status?: string
          twitter_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          position: number
          repo_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          position?: number
          repo_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          position?: number
          repo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "saved_repos"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      edit_suggestion_votes: {
        Row: {
          created_at: string
          id: string
          suggestion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion_id?: string
          user_id?: string
        }
        Relationships: []
      }
      edit_suggestions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          created_at: string
          id: string
          proposed_changes: Json
          reason: string | null
          status: string
          target_id: string
          target_name: string | null
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string
          id?: string
          proposed_changes?: Json
          reason?: string | null
          status?: string
          target_id: string
          target_name?: string | null
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string
          id?: string
          proposed_changes?: Json
          reason?: string | null
          status?: string
          target_id?: string
          target_name?: string | null
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          drawing_data: Json
          id: string
          linked_id: string | null
          linked_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          drawing_data?: Json
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          drawing_data?: Json
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      repo_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          repo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          repo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          repo_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repo_comments_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "saved_repos"
            referencedColumns: ["id"]
          },
        ]
      }
      repo_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          repo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          repo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          repo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repo_ratings_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "saved_repos"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          roadmap_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          roadmap_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          roadmap_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_comments_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_type: string
          position: number
          ref_repo_id: string | null
          ref_tool_id: string | null
          roadmap_id: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string
          position?: number
          ref_repo_id?: string | null
          ref_tool_id?: string | null
          roadmap_id: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string
          position?: number
          ref_repo_id?: string | null
          ref_tool_id?: string | null
          roadmap_id?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_votes: {
        Row: {
          created_at: string
          id: string
          roadmap_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          roadmap_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          roadmap_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_votes_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          ai_markdown: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          tags: string[] | null
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_markdown?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          tags?: string[] | null
          title: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_markdown?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          tags?: string[] | null
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_repos: {
        Row: {
          created_at: string
          description: string | null
          forks_count: number
          full_name: string
          github_id: number
          html_url: string
          id: string
          language: string | null
          license: string | null
          name: string
          open_issues_count: number
          owner_avatar_url: string
          owner_login: string
          stargazers_count: number
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          forks_count?: number
          full_name: string
          github_id: number
          html_url: string
          id?: string
          language?: string | null
          license?: string | null
          name: string
          open_issues_count?: number
          owner_avatar_url: string
          owner_login: string
          stargazers_count?: number
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          forks_count?: number
          full_name?: string
          github_id?: number
          html_url?: string
          id?: string
          language?: string | null
          license?: string | null
          name?: string
          open_issues_count?: number
          owner_avatar_url?: string
          owner_login?: string
          stargazers_count?: number
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
