export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          key_name: string
          last_used: string | null
          permissions: string[]
          revoked: boolean
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          key_name: string
          last_used?: string | null
          permissions?: string[]
          revoked?: boolean
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          key_name?: string
          last_used?: string | null
          permissions?: string[]
          revoked?: boolean
          user_id?: string
        }
        Relationships: []
      }
      completed_workouts: {
        Row: {
          completed_at: string
          created_at: string
          duration: number
          id: string
          notes: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration: number
          id?: string
          notes?: string | null
          user_id: string
          workout_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      exercise_equipment: {
        Row: {
          equipment_id: number
          exercise_id: string
        }
        Insert: {
          equipment_id: number
          exercise_id: string
        }
        Update: {
          equipment_id?: number
          exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_equipment_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_muscles: {
        Row: {
          exercise_id: string
          muscle_id: number
        }
        Insert: {
          exercise_id: string
          muscle_id: number
        }
        Update: {
          exercise_id?: string
          muscle_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_muscles_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_muscles_muscle_id_fkey"
            columns: ["muscle_id"]
            isOneToOne: false
            referencedRelation: "muscles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_templates: {
        Row: {
          created_at: string
          description: string
          exercise_base: number | null
          id: string
          media_url: string | null
          name: string
          target_muscle: string | null
        }
        Insert: {
          created_at?: string
          description: string
          exercise_base?: number | null
          id?: string
          media_url?: string | null
          name: string
          target_muscle?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          exercise_base?: number | null
          id?: string
          media_url?: string | null
          name?: string
          target_muscle?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          name: string
          notes: string | null
          reps: number
          rest_time: number | null
          sets: number
          weight: number | null
          workout_id: string
        }
        Insert: {
          id?: string
          name: string
          notes?: string | null
          reps: number
          rest_time?: number | null
          sets: number
          weight?: number | null
          workout_id: string
        }
        Update: {
          id?: string
          name?: string
          notes?: string | null
          reps?: number
          rest_time?: number | null
          sets?: number
          weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          calories: number
          carbs: number | null
          created_at: string | null
          date: string | null
          fat: number | null
          id: string
          name: string
          protein: number | null
          user_id: string
        }
        Insert: {
          calories: number
          carbs?: number | null
          created_at?: string | null
          date?: string | null
          fat?: number | null
          id?: string
          name: string
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number | null
          created_at?: string | null
          date?: string | null
          fat?: number | null
          id?: string
          name?: string
          protein?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      muscles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          daily_calories: number | null
          full_name: string | null
          height: number | null
          hour_goal: number | null
          id: string
          updated_at: string
          username: string | null
          workout_goal: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          daily_calories?: number | null
          full_name?: string | null
          height?: number | null
          hour_goal?: number | null
          id: string
          updated_at?: string
          username?: string | null
          workout_goal?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          daily_calories?: number | null
          full_name?: string | null
          height?: number | null
          hour_goal?: number | null
          id?: string
          updated_at?: string
          username?: string | null
          workout_goal?: number | null
        }
        Relationships: []
      }
      weight_records: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      workout_muscles: {
        Row: {
          created_at: string
          id: string
          muscle_name: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muscle_name: string
          workout_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muscle_name?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_muscles_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          default_rest_time: number | null
          duration: number
          id: string
          notes: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_rest_time?: number | null
          duration: number
          id?: string
          notes?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_rest_time?: number | null
          duration?: number
          id?: string
          notes?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
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
      create_user_api_key: {
        Args: {
          name_param: string
          permissions_param?: string[]
        }
        Returns: {
          id: string
          key_name: string
          api_key: string
          created_at: string
          permissions: string[]
        }[]
      }
      generate_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_completed_workouts_since: {
        Args: {
          start_date: string
        }
        Returns: {
          id: string
          workout_id: string
          duration: number
          completed_at: string
        }[]
      }
      get_trained_muscles_since: {
        Args: {
          start_date: string
        }
        Returns: {
          muscle_name: string
        }[]
      }
      record_completed_workout: {
        Args: {
          workout_id_param: string
          duration_param: number
        }
        Returns: undefined
      }
      verify_api_key: {
        Args: {
          api_key_param: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
