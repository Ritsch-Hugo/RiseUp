export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      muscu_exercises: {
        Row: {
          archived_at: string | null
          created_at: string
          equipment: Database['public']['Enums']['equipment_type'] | null
          id: string
          image_path: string | null
          instructions: string | null
          is_custom: boolean
          name: string
          primary_group: Database['public']['Enums']['muscle_group']
          secondary_groups: Database['public']['Enums']['muscle_group'][]
          tracking: Database['public']['Enums']['exercise_tracking']
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          equipment?: Database['public']['Enums']['equipment_type'] | null
          id: string
          image_path?: string | null
          instructions?: string | null
          is_custom?: boolean
          name: string
          primary_group: Database['public']['Enums']['muscle_group']
          secondary_groups?: Database['public']['Enums']['muscle_group'][]
          tracking?: Database['public']['Enums']['exercise_tracking']
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          equipment?: Database['public']['Enums']['equipment_type'] | null
          id?: string
          image_path?: string | null
          instructions?: string | null
          is_custom?: boolean
          name?: string
          primary_group?: Database['public']['Enums']['muscle_group']
          secondary_groups?: Database['public']['Enums']['muscle_group'][]
          tracking?: Database['public']['Enums']['exercise_tracking']
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      muscu_program_sessions: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          program_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          position?: number
          program_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          program_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'muscu_program_sessions_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'muscu_programs'
            referencedColumns: ['id']
          },
        ]
      }
      muscu_programs: {
        Row: {
          archived_at: string | null
          created_at: string
          days_per_week: number | null
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          days_per_week?: number | null
          id: string
          name: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          days_per_week?: number | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      muscu_session_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          position: number
          rest_seconds: number | null
          session_id: string
          target_reps_max: number | null
          target_reps_min: number | null
          target_sets: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id: string
          notes?: string | null
          position?: number
          rest_seconds?: number | null
          session_id: string
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          rest_seconds?: number | null
          session_id?: string
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'muscu_session_exercises_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'muscu_exercises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'muscu_session_exercises_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'muscu_program_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      muscu_sets: {
        Row: {
          created_at: string
          done_at: string
          duration_seconds: number | null
          id: string
          is_warmup: boolean
          position: number
          reps: number
          rpe: number | null
          updated_at: string
          user_id: string
          weight_kg: number
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string
          done_at?: string
          duration_seconds?: number | null
          id: string
          is_warmup?: boolean
          position?: number
          reps?: number
          rpe?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number
          workout_exercise_id: string
        }
        Update: {
          created_at?: string
          done_at?: string
          duration_seconds?: number | null
          id?: string
          is_warmup?: boolean
          position?: number
          reps?: number
          rpe?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'muscu_sets_workout_exercise_id_fkey'
            columns: ['workout_exercise_id']
            isOneToOne: false
            referencedRelation: 'muscu_workout_exercises'
            referencedColumns: ['id']
          },
        ]
      }
      muscu_settings: {
        Row: {
          created_at: string
          id: string
          muscle_sets_threshold: number
          updated_at: string
          user_id: string
          weekly_goal: number
        }
        Insert: {
          created_at?: string
          id: string
          muscle_sets_threshold?: number
          updated_at?: string
          user_id?: string
          weekly_goal?: number
        }
        Update: {
          created_at?: string
          id?: string
          muscle_sets_threshold?: number
          updated_at?: string
          user_id?: string
          weekly_goal?: number
        }
        Relationships: []
      }
      muscu_workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          position: number
          rest_seconds: number | null
          target_reps_max: number | null
          target_reps_min: number | null
          target_sets: number | null
          updated_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id: string
          notes?: string | null
          position?: number
          rest_seconds?: number | null
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          rest_seconds?: number | null
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'muscu_workout_exercises_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'muscu_exercises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'muscu_workout_exercises_workout_id_fkey'
            columns: ['workout_id']
            isOneToOne: false
            referencedRelation: 'muscu_workout_records'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'muscu_workout_exercises_workout_id_fkey'
            columns: ['workout_id']
            isOneToOne: false
            referencedRelation: 'muscu_workout_stats'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'muscu_workout_exercises_workout_id_fkey'
            columns: ['workout_id']
            isOneToOne: false
            referencedRelation: 'muscu_workouts'
            referencedColumns: ['id']
          },
        ]
      }
      muscu_workouts: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          name: string
          notes: string | null
          session_id: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id: string
          name: string
          notes?: string | null
          session_id?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          session_id?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'muscu_workouts_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'muscu_program_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      nutri_entries: {
        Row: {
          carbs: number
          created_at: string
          day: string
          fat: number
          fiber: number
          food_id: string
          from_meal_id: string | null
          id: string
          kcal: number
          protein: number
          quantity_g: number
          salt: number
          saturated_fat: number
          slot: Database['public']['Enums']['meal_slot']
          sugars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          carbs?: number
          created_at?: string
          day: string
          fat?: number
          fiber?: number
          food_id: string
          from_meal_id?: string | null
          id: string
          kcal: number
          protein?: number
          quantity_g: number
          salt?: number
          saturated_fat?: number
          slot: Database['public']['Enums']['meal_slot']
          sugars?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          carbs?: number
          created_at?: string
          day?: string
          fat?: number
          fiber?: number
          food_id?: string
          from_meal_id?: string | null
          id?: string
          kcal?: number
          protein?: number
          quantity_g?: number
          salt?: number
          saturated_fat?: number
          slot?: Database['public']['Enums']['meal_slot']
          sugars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nutri_entries_food_id_fkey'
            columns: ['food_id']
            isOneToOne: false
            referencedRelation: 'nutri_foods'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'nutri_entries_from_meal_id_fkey'
            columns: ['from_meal_id']
            isOneToOne: false
            referencedRelation: 'nutri_meals'
            referencedColumns: ['id']
          },
        ]
      }
      nutri_foods: {
        Row: {
          archived_at: string | null
          barcode: string | null
          brand: string | null
          carbs: number
          created_at: string
          fat: number
          fiber: number
          id: string
          is_favorite: boolean
          kcal: number | null
          name: string
          protein: number
          salt: number
          saturated_fat: number
          serving_g: number | null
          serving_label: string | null
          source: Database['public']['Enums']['food_source']
          sugars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          barcode?: string | null
          brand?: string | null
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          id: string
          is_favorite?: boolean
          kcal?: number | null
          name: string
          protein?: number
          salt?: number
          saturated_fat?: number
          serving_g?: number | null
          serving_label?: string | null
          source?: Database['public']['Enums']['food_source']
          sugars?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          barcode?: string | null
          brand?: string | null
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          is_favorite?: boolean
          kcal?: number | null
          name?: string
          protein?: number
          salt?: number
          saturated_fat?: number
          serving_g?: number | null
          serving_label?: string | null
          source?: Database['public']['Enums']['food_source']
          sugars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutri_goals: {
        Row: {
          carbs_g: number
          created_at: string
          effective_from: string
          fat_g: number
          fiber_g: number
          id: string
          kcal: number
          min_slots_tracked: number
          protein_g: number
          salt_g: number
          updated_at: string
          user_id: string
          water_ml: number
        }
        Insert: {
          carbs_g?: number
          created_at?: string
          effective_from: string
          fat_g?: number
          fiber_g?: number
          id: string
          kcal?: number
          min_slots_tracked?: number
          protein_g?: number
          salt_g?: number
          updated_at?: string
          user_id?: string
          water_ml?: number
        }
        Update: {
          carbs_g?: number
          created_at?: string
          effective_from?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          kcal?: number
          min_slots_tracked?: number
          protein_g?: number
          salt_g?: number
          updated_at?: string
          user_id?: string
          water_ml?: number
        }
        Relationships: []
      }
      nutri_meal_items: {
        Row: {
          created_at: string
          food_id: string
          id: string
          meal_id: string
          quantity_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_id: string
          id: string
          meal_id: string
          quantity_g: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          food_id?: string
          id?: string
          meal_id?: string
          quantity_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nutri_meal_items_food_id_fkey'
            columns: ['food_id']
            isOneToOne: false
            referencedRelation: 'nutri_foods'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'nutri_meal_items_meal_id_fkey'
            columns: ['meal_id']
            isOneToOne: false
            referencedRelation: 'nutri_meals'
            referencedColumns: ['id']
          },
        ]
      }
      nutri_meals: {
        Row: {
          created_at: string
          default_slot: Database['public']['Enums']['meal_slot'] | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_slot?: Database['public']['Enums']['meal_slot'] | null
          id: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          default_slot?: Database['public']['Enums']['meal_slot'] | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutri_water: {
        Row: {
          amount_ml: number
          created_at: string
          day: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          day: string
          id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          day?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      muscu_workout_records: {
        Row: {
          id: string | null
          records: number | null
          user_id: string | null
        }
        Relationships: []
      }
      muscu_workout_stats: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          groups: Database['public']['Enums']['muscle_group'][] | null
          id: string | null
          name: string | null
          session_id: string | null
          started_at: string | null
          user_id: string | null
          volume: number | null
          working_sets: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'muscu_workouts_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'muscu_program_sessions'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      equipment_type: 'barre' | 'halteres' | 'machine' | 'poulie' | 'poids_du_corps' | 'autre'
      exercise_tracking: 'poids_reps' | 'reps' | 'duree'
      food_source: 'off' | 'perso'
      meal_slot: 'petit_dej' | 'dejeuner' | 'diner' | 'collation'
      muscle_group:
        | 'pecs'
        | 'dos'
        | 'epaules'
        | 'biceps'
        | 'triceps'
        | 'quadriceps'
        | 'ischios'
        | 'fessiers'
        | 'mollets'
        | 'abdos'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      equipment_type: ['barre', 'halteres', 'machine', 'poulie', 'poids_du_corps', 'autre'],
      exercise_tracking: ['poids_reps', 'reps', 'duree'],
      food_source: ['off', 'perso'],
      meal_slot: ['petit_dej', 'dejeuner', 'diner', 'collation'],
      muscle_group: [
        'pecs',
        'dos',
        'epaules',
        'biceps',
        'triceps',
        'quadriceps',
        'ischios',
        'fessiers',
        'mollets',
        'abdos',
      ],
    },
  },
} as const
