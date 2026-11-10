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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      completed_lessons: {
        Row: {
          completed_at: string | null
          id: number
          lesson_id: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: number
          lesson_id?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: number
          lesson_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "completed_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_lessons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          creator_id: string | null
          description: string | null
          difficulty_level: string | null
          instruction_language: string
          slug: string
          sort_order: number
          id: number
          is_published: boolean | null
          target_dialect_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          difficulty_level?: string | null
          instruction_language?: string
          slug?: string
          sort_order?: number
          id?: number
          is_published?: boolean | null
          target_dialect_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          difficulty_level?: string | null
          instruction_language?: string
          slug?: string
          sort_order?: number
          id?: number
          is_published?: boolean | null
          target_dialect_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_target_dialect_id_fkey"
            columns: ["target_dialect_id"]
            isOneToOne: false
            referencedRelation: "dialects"
            referencedColumns: ["id"]
          },
        ]
      }
      definition_comments: {
        Row: {
          content: string
          created_at: string
          definition_id: number
          id: number
          is_edited: boolean
          parent_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          definition_id: number
          id?: number
          is_edited?: boolean
          parent_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          definition_id?: number
          id?: number
          is_edited?: boolean
          parent_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "definition_comments_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "definition_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "definition_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "definition_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      definitions: {
        Row: {
          attributes: Json | null
          audio_url: string | null
          created_at: string | null
          definition_text: string
          dialect_id: number | null
          headword_id: number | null
          id: number
          is_verified: boolean | null
          language_code: string
          updated_at: string | null
          user_id: string | null
          verified_by: string | null
          vote_score: number | null
        }
        Insert: {
          attributes?: Json | null
          audio_url?: string | null
          created_at?: string | null
          definition_text: string
          dialect_id?: number | null
          headword_id?: number | null
          id?: number
          is_verified?: boolean | null
          language_code?: string
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
          vote_score?: number | null
        }
        Update: {
          attributes?: Json | null
          audio_url?: string | null
          created_at?: string | null
          definition_text?: string
          dialect_id?: number | null
          headword_id?: number | null
          id?: number
          is_verified?: boolean | null
          language_code?: string
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
          vote_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "definitions_dialect_id_fkey"
            columns: ["dialect_id"]
            isOneToOne: false
            referencedRelation: "dialects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "definitions_headword_id_fkey"
            columns: ["headword_id"]
            isOneToOne: false
            referencedRelation: "headwords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "definitions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "definitions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dialects: {
        Row: {
          id: number
          name: string
          region_description: string | null
        }
        Insert: {
          id?: number
          name: string
          region_description?: string | null
        }
        Update: {
          id?: number
          name?: string
          region_description?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: number | null
          current_lesson_id: number | null
          current_step_id: number | null
          id: number
          is_completed: boolean | null
          last_accessed_at: string | null
          user_id: string | null
        }
        Insert: {
          course_id?: number | null
          current_lesson_id?: number | null
          current_step_id?: number | null
          id?: number
          is_completed?: boolean | null
          last_accessed_at?: string | null
          user_id?: string | null
        }
        Update: {
          course_id?: number | null
          current_lesson_id?: number | null
          current_step_id?: number | null
          id?: number
          is_completed?: boolean | null
          last_accessed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      examples: {
        Row: {
          created_at: string | null
          definition_id: number | null
          id: number
          sentence_text: string
          translation_text: string | null
          updated_at: string | null
          user_id: string | null
          vote_score: number | null
        }
        Insert: {
          created_at?: string | null
          definition_id?: number | null
          id?: number
          sentence_text: string
          translation_text?: string | null
          updated_at?: string | null
          user_id?: string | null
          vote_score?: number | null
        }
        Update: {
          created_at?: string | null
          definition_id?: number | null
          id?: number
          sentence_text?: string
          translation_text?: string | null
          updated_at?: string | null
          user_id?: string | null
          vote_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "examples_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      headwords: {
        Row: {
          created_at: string | null
          id: number
          script_arabic: string | null
          script_latin: string | null
          script_tifinagh: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          script_arabic?: string | null
          script_latin?: string | null
          script_tifinagh?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          script_arabic?: string | null
          script_latin?: string | null
          script_tifinagh?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          created_at: string | null
          id: number
          module_id: number | null
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          module_id?: number | null
          sort_order: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          module_id?: number | null
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: number | null
          created_at: string | null
          id: number
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id?: number | null
          created_at?: string | null
          id?: number
          sort_order: number
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: number | null
          created_at?: string | null
          id?: number
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          preferred_locale: string
          reputation_points: number | null
          role: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          preferred_locale?: string
          reputation_points?: number | null
          role?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          preferred_locale?: string
          reputation_points?: number | null
          role?: string | null
          username?: string
        }
        Relationships: []
      }
      steps: {
        Row: {
          content: Json | null
          id: number
          lesson_id: number | null
          linked_headword_id: number | null
          sort_order: number
          step_type: string | null
        }
        Insert: {
          content?: Json | null
          id?: number
          lesson_id?: number | null
          linked_headword_id?: number | null
          sort_order: number
          step_type?: string | null
        }
        Update: {
          content?: Json | null
          id?: number
          lesson_id?: number | null
          linked_headword_id?: number | null
          sort_order?: number
          step_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steps_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "steps_linked_headword_id_fkey"
            columns: ["linked_headword_id"]
            isOneToOne: false
            referencedRelation: "headwords"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string | null
          definition_id: number | null
          example_id: number | null
          id: number
          user_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          definition_id?: number | null
          example_id?: number | null
          id?: number
          user_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          definition_id?: number | null
          example_id?: number | null
          id?: number
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      word_relations: {
        Row: {
          created_at: string
          id: number
          relation_type: string
          source_headword_id: number
          target_headword_id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          relation_type?: string
          source_headword_id: number
          target_headword_id: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          relation_type?: string
          source_headword_id?: number
          target_headword_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_relations_source_headword_id_fkey"
            columns: ["source_headword_id"]
            isOneToOne: false
            referencedRelation: "headwords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_relations_target_headword_id_fkey"
            columns: ["target_headword_id"]
            isOneToOne: false
            referencedRelation: "headwords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_relations_user_id_fkey"
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
      complete_lesson: {
        Args: {
          p_course_id: number
          p_lesson_id: number
        }
        Returns: Json
      }
      get_dictionary_stats: {
        Args: never
        Returns: {
          total_definitions: number
          total_words: number
        }[]
      }
      get_random_word: {
        Args: never
        Returns: {
          created_at: string | null
          id: number
          script_arabic: string | null
          script_latin: string | null
          script_tifinagh: string | null
          slug: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "headwords"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_profile_stats: {
        Args: { target_user_id: string }
        Returns: {
          definition_count: number
          reputation_score: number
          total_upvotes: number
        }[]
      }
      is_moderator_or_admin: { Args: never; Returns: boolean }
      normalize_amazigh_latin: { Args: { input_text: string }; Returns: string }
      search_dictionary: {
        Args: { term: string }
        Returns: {
          headword_text: string
          id: number
          match_preview: string
          match_type: string
          script_arabic: string
          script_tifinagh: string
          similarity: number
          slug: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
