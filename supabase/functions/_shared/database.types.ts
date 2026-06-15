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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          config: Json
          created_at: string
          end_at: string | null
          id: string
          is_active: boolean
          name: string
          start_at: string | null
          updated_at: string
          variant: string
        }
        Insert: {
          config?: Json
          created_at?: string
          end_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_at?: string | null
          updated_at?: string
          variant?: string
        }
        Update: {
          config?: Json
          created_at?: string
          end_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_at?: string | null
          updated_at?: string
          variant?: string
        }
        Relationships: []
      }
      bookmakers: {
        Row: {
          api_endpoint: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          rate_limit: number | null
          region: string | null
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          id: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          rate_limit?: number | null
          region?: string | null
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          rate_limit?: number | null
          region?: string | null
        }
        Relationships: []
      }
      calibration_snapshots: {
        Row: {
          by_grade: Json
          by_sport: Json
          generated_at: string
          id: number
          metadata: Json | null
          overall_hit_rate: number | null
          sport: Database["public"]["Enums"]["sport_enum"] | null
          total_picks: number | null
        }
        Insert: {
          by_grade?: Json
          by_sport?: Json
          generated_at?: string
          id?: number
          metadata?: Json | null
          overall_hit_rate?: number | null
          sport?: Database["public"]["Enums"]["sport_enum"] | null
          total_picks?: number | null
        }
        Update: {
          by_grade?: Json
          by_sport?: Json
          generated_at?: string
          id?: number
          metadata?: Json | null
          overall_hit_rate?: number | null
          sport?: Database["public"]["Enums"]["sport_enum"] | null
          total_picks?: number | null
        }
        Relationships: []
      }
      dynamic_weights: {
        Row: {
          adjusted_weight: number
          correlation: number | null
          created_at: string
          default_weight: number
          games_sampled: number
          id: string
          last_recalc_at: string | null
          sport: Database["public"]["Enums"]["sport_enum"]
          variable_name: string
        }
        Insert: {
          adjusted_weight: number
          correlation?: number | null
          created_at?: string
          default_weight: number
          games_sampled?: number
          id?: string
          last_recalc_at?: string | null
          sport: Database["public"]["Enums"]["sport_enum"]
          variable_name: string
        }
        Update: {
          adjusted_weight?: number
          correlation?: number | null
          created_at?: string
          default_weight?: number
          games_sampled?: number
          id?: string
          last_recalc_at?: string | null
          sport?: Database["public"]["Enums"]["sport_enum"]
          variable_name?: string
        }
        Relationships: []
      }
      edge_opportunities: {
        Row: {
          confidence: number
          created_at: string
          detected_at: string
          expected_value: number | null
          expires_at: string | null
          game_id: string
          id: string
          metadata: Json | null
          recommended_sizing: number | null
          signal_type: Database["public"]["Enums"]["edge_signal_enum"]
          status: Database["public"]["Enums"]["edge_status_enum"]
        }
        Insert: {
          confidence: number
          created_at?: string
          detected_at?: string
          expected_value?: number | null
          expires_at?: string | null
          game_id: string
          id?: string
          metadata?: Json | null
          recommended_sizing?: number | null
          signal_type: Database["public"]["Enums"]["edge_signal_enum"]
          status?: Database["public"]["Enums"]["edge_status_enum"]
        }
        Update: {
          confidence?: number
          created_at?: string
          detected_at?: string
          expected_value?: number | null
          expires_at?: string | null
          game_id?: string
          id?: string
          metadata?: Json | null
          recommended_sizing?: number | null
          signal_type?: Database["public"]["Enums"]["edge_signal_enum"]
          status?: Database["public"]["Enums"]["edge_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "edge_opportunities_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_opportunities_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: boolean
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: boolean
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: boolean
        }
        Relationships: []
      }
      games: {
        Row: {
          away_score: number | null
          away_team: string
          created_at: string
          home_score: number | null
          home_team: string
          id: string
          league: string | null
          odds_api_id: string | null
          scheduled_at: string
          sport: Database["public"]["Enums"]["sport_enum"]
          status: Database["public"]["Enums"]["game_status_enum"]
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team: string
          created_at?: string
          home_score?: number | null
          home_team: string
          id: string
          league?: string | null
          odds_api_id?: string | null
          scheduled_at: string
          sport: Database["public"]["Enums"]["sport_enum"]
          status?: Database["public"]["Enums"]["game_status_enum"]
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team?: string
          created_at?: string
          home_score?: number | null
          home_team?: string
          id?: string
          league?: string | null
          odds_api_id?: string | null
          scheduled_at?: string
          sport?: Database["public"]["Enums"]["sport_enum"]
          status?: Database["public"]["Enums"]["game_status_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
        ]
      }
      grades_2025_01: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_02: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_03: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_04: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_05: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_06: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_07: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_08: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_09: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_10: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_11: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2025_12: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_01: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_02: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_03: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_04: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_05: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_06: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_07: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_08: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_09: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_10: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_11: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_2026_12: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      grades_default: {
        Row: {
          ai_confidence: number | null
          ai_score: number | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata: Json | null
          model_breakdown: Json | null
          our_confidence: number | null
          our_score: number | null
          time: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time: string
        }
        Update: {
          ai_confidence?: number | null
          ai_score?: number | null
          consensus_confidence?: number | null
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          game_id?: string
          grade_letter?: Database["public"]["Enums"]["grade_letter_enum"] | null
          metadata?: Json | null
          model_breakdown?: Json | null
          our_confidence?: number | null
          our_score?: number | null
          time?: string
        }
        Relationships: []
      }
      gut_picks: {
        Row: {
          created_at: string
          engine_pick_side: string | null
          game_id: string
          id: string
          pick_date: string
          pick_side: string
          sport: Database["public"]["Enums"]["sport_enum"]
          user_id: string
        }
        Insert: {
          created_at?: string
          engine_pick_side?: string | null
          game_id: string
          id?: string
          pick_date: string
          pick_side: string
          sport: Database["public"]["Enums"]["sport_enum"]
          user_id: string
        }
        Update: {
          created_at?: string
          engine_pick_side?: string | null
          game_id?: string
          id?: string
          pick_date?: string
          pick_side?: string
          sport?: Database["public"]["Enums"]["sport_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gut_picks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gut_picks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gut_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      line_movements: {
        Row: {
          bookmaker: string
          delta: number
          game_id: string
          id: string
          metadata: Json | null
          movement_type: Database["public"]["Enums"]["movement_type_enum"]
          new_value: number
          old_value: number
          percent_change: number | null
          time: string
          triggered_alert: boolean | null
        }
        Insert: {
          bookmaker: string
          delta: number
          game_id: string
          id?: string
          metadata?: Json | null
          movement_type: Database["public"]["Enums"]["movement_type_enum"]
          new_value: number
          old_value: number
          percent_change?: number | null
          time?: string
          triggered_alert?: boolean | null
        }
        Update: {
          bookmaker?: string
          delta?: number
          game_id?: string
          id?: string
          metadata?: Json | null
          movement_type?: Database["public"]["Enums"]["movement_type_enum"]
          new_value?: number
          old_value?: number
          percent_change?: number | null
          time?: string
          triggered_alert?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "line_movements_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_movements_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
        ]
      }
      locked_games: {
        Row: {
          created_at: string
          game_id: string
          id: string
          sport: Database["public"]["Enums"]["sport_enum"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          sport?: Database["public"]["Enums"]["sport_enum"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          sport?: Database["public"]["Enums"]["sport_enum"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locked_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locked_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locked_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      model_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          fast: boolean
          game_id: string | null
          id: string
          league: string | null
          result: Json | null
          sport: Database["public"]["Enums"]["sport_enum"]
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          fast?: boolean
          game_id?: string | null
          id?: string
          league?: string | null
          result?: Json | null
          sport: Database["public"]["Enums"]["sport_enum"]
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          fast?: boolean
          game_id?: string | null
          id?: string
          league?: string | null
          result?: Json | null
          sport?: Database["public"]["Enums"]["sport_enum"]
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_jobs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_jobs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
        ]
      }
      model_performance: {
        Row: {
          actual_margin: number | null
          actual_result: Database["public"]["Enums"]["pick_result_enum"] | null
          created_at: string
          game_id: string
          grade_accuracy: number | null
          id: string
          model_name: string
          pick_correct: boolean | null
          predicted_grade:
            | Database["public"]["Enums"]["grade_letter_enum"]
            | null
          predicted_pick: string | null
          sport: Database["public"]["Enums"]["sport_enum"]
        }
        Insert: {
          actual_margin?: number | null
          actual_result?: Database["public"]["Enums"]["pick_result_enum"] | null
          created_at?: string
          game_id: string
          grade_accuracy?: number | null
          id?: string
          model_name: string
          pick_correct?: boolean | null
          predicted_grade?:
            | Database["public"]["Enums"]["grade_letter_enum"]
            | null
          predicted_pick?: string | null
          sport: Database["public"]["Enums"]["sport_enum"]
        }
        Update: {
          actual_margin?: number | null
          actual_result?: Database["public"]["Enums"]["pick_result_enum"] | null
          created_at?: string
          game_id?: string
          grade_accuracy?: number | null
          id?: string
          model_name?: string
          pick_correct?: boolean | null
          predicted_grade?:
            | Database["public"]["Enums"]["grade_letter_enum"]
            | null
          predicted_pick?: string | null
          sport?: Database["public"]["Enums"]["sport_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "model_performance_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_performance_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
        ]
      }
      model_responses: {
        Row: {
          confidence: number | null
          created_at: string
          game_id: string
          grade: Database["public"]["Enums"]["grade_letter_enum"] | null
          id: string
          model_name: string
          odds_hash: string | null
          pick: string | null
          raw_response: string | null
          reasoning: string | null
          score: number | null
          source: string
          sport: Database["public"]["Enums"]["sport_enum"] | null
          thesis: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          game_id: string
          grade?: Database["public"]["Enums"]["grade_letter_enum"] | null
          id?: string
          model_name: string
          odds_hash?: string | null
          pick?: string | null
          raw_response?: string | null
          reasoning?: string | null
          score?: number | null
          source?: string
          sport?: Database["public"]["Enums"]["sport_enum"] | null
          thesis?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          game_id?: string
          grade?: Database["public"]["Enums"]["grade_letter_enum"] | null
          id?: string
          model_name?: string
          odds_hash?: string | null
          pick?: string | null
          raw_response?: string | null
          reasoning?: string | null
          score?: number | null
          source?: string
          sport?: Database["public"]["Enums"]["sport_enum"] | null
          thesis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_responses_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_responses_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
        ]
      }
      odds_history: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "odds_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odds_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
        ]
      }
      odds_history_2025_01: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_02: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_03: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_04: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_05: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_06: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_07: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_08: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_09: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_10: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_11: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2025_12: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_01: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_02: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_03: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_04: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_05: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_06: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_07: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_08: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_09: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_10: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_11: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_2026_12: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      odds_history_default: {
        Row: {
          bookmaker: string
          fetched_at: string
          game_id: string
          ml_away: number | null
          ml_home: number | null
          over_odds: number | null
          spread: number | null
          spread_away_odds: number | null
          spread_home_odds: number | null
          time: string
          total: number | null
          under_odds: number | null
        }
        Insert: {
          bookmaker: string
          fetched_at?: string
          game_id: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time: string
          total?: number | null
          under_odds?: number | null
        }
        Update: {
          bookmaker?: string
          fetched_at?: string
          game_id?: string
          ml_away?: number | null
          ml_home?: number | null
          over_odds?: number | null
          spread?: number | null
          spread_away_odds?: number | null
          spread_home_odds?: number | null
          time?: string
          total?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      picks: {
        Row: {
          amount: number
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          created_at: string
          engine_score: number | null
          game_id: string
          grade: Database["public"]["Enums"]["grade_letter_enum"] | null
          id: string
          line: number | null
          locked_at: string
          notes: string | null
          odds: number
          pick_data: Json | null
          pick_type: Database["public"]["Enums"]["pick_type_enum"]
          profit: number | null
          result: Database["public"]["Enums"]["pick_result_enum"]
          settled_at: string | null
          side: Database["public"]["Enums"]["pick_side_enum"]
          sport: Database["public"]["Enums"]["sport_enum"]
          team: string
          user_id: string
        }
        Insert: {
          amount?: number
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          created_at?: string
          engine_score?: number | null
          game_id: string
          grade?: Database["public"]["Enums"]["grade_letter_enum"] | null
          id?: string
          line?: number | null
          locked_at?: string
          notes?: string | null
          odds?: number
          pick_data?: Json | null
          pick_type?: Database["public"]["Enums"]["pick_type_enum"]
          profit?: number | null
          result?: Database["public"]["Enums"]["pick_result_enum"]
          settled_at?: string | null
          side: Database["public"]["Enums"]["pick_side_enum"]
          sport: Database["public"]["Enums"]["sport_enum"]
          team: string
          user_id: string
        }
        Update: {
          amount?: number
          consensus_score?: number | null
          convergence_status?:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          created_at?: string
          engine_score?: number | null
          game_id?: string
          grade?: Database["public"]["Enums"]["grade_letter_enum"] | null
          id?: string
          line?: number | null
          locked_at?: string
          notes?: string | null
          odds?: number
          pick_data?: Json | null
          pick_type?: Database["public"]["Enums"]["pick_type_enum"]
          profit?: number | null
          result?: Database["public"]["Enums"]["pick_result_enum"]
          settled_at?: string | null
          side?: Database["public"]["Enums"]["pick_side_enum"]
          sport?: Database["public"]["Enums"]["sport_enum"]
          team?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "picks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "v_games_with_latest_grade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_bankroll: number
          display_name: string
          id: string
          losses: number
          pushes: number
          role: Database["public"]["Enums"]["user_role_enum"]
          starting_bankroll: number
          total_profit: number
          total_wagered: number
          updated_at: string
          username: string
          wins: number
        }
        Insert: {
          created_at?: string
          current_bankroll?: number
          display_name: string
          id: string
          losses?: number
          pushes?: number
          role?: Database["public"]["Enums"]["user_role_enum"]
          starting_bankroll?: number
          total_profit?: number
          total_wagered?: number
          updated_at?: string
          username: string
          wins?: number
        }
        Update: {
          created_at?: string
          current_bankroll?: number
          display_name?: string
          id?: string
          losses?: number
          pushes?: number
          role?: Database["public"]["Enums"]["user_role_enum"]
          starting_bankroll?: number
          total_profit?: number
          total_wagered?: number
          updated_at?: string
          username?: string
          wins?: number
        }
        Relationships: []
      }
      sports_config: {
        Row: {
          config: Json | null
          created_at: string
          current_season: number | null
          grading_weights: Json | null
          id: Database["public"]["Enums"]["sport_enum"]
          is_active: boolean | null
          name: string
          season_type: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string
          current_season?: number | null
          grading_weights?: Json | null
          id: Database["public"]["Enums"]["sport_enum"]
          is_active?: boolean | null
          name: string
          season_type?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string
          current_season?: number | null
          grading_weights?: Json | null
          id?: Database["public"]["Enums"]["sport_enum"]
          is_active?: boolean | null
          name?: string
          season_type?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          duration_ms: number | null
          games_snapped: number
          id: string
          metadata: Json | null
          sports: string[]
          status: string
          synced_at: string
        }
        Insert: {
          duration_ms?: number | null
          games_snapped?: number
          id?: string
          metadata?: Json | null
          sports?: string[]
          status?: string
          synced_at?: string
        }
        Update: {
          duration_ms?: number | null
          games_snapped?: number
          id?: string
          metadata?: Json | null
          sports?: string[]
          status?: string
          synced_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          abbreviation: string
          city: string | null
          conference: string | null
          created_at: string
          division: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          sport: Database["public"]["Enums"]["sport_enum"]
        }
        Insert: {
          abbreviation: string
          city?: string | null
          conference?: string | null
          created_at?: string
          division?: string | null
          id: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          sport: Database["public"]["Enums"]["sport_enum"]
        }
        Update: {
          abbreviation?: string
          city?: string | null
          conference?: string | null
          created_at?: string
          division?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          sport?: Database["public"]["Enums"]["sport_enum"]
        }
        Relationships: []
      }
    }
    Views: {
      v_games_with_latest_grade: {
        Row: {
          away_score: number | null
          away_team: string | null
          consensus_confidence: number | null
          consensus_score: number | null
          convergence_status:
            | Database["public"]["Enums"]["convergence_status_enum"]
            | null
          created_at: string | null
          grade_letter: Database["public"]["Enums"]["grade_letter_enum"] | null
          grade_time: string | null
          home_score: number | null
          home_team: string | null
          id: string | null
          league: string | null
          odds_api_id: string | null
          scheduled_at: string | null
          sport: Database["public"]["Enums"]["sport_enum"] | null
          status: Database["public"]["Enums"]["game_status_enum"] | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_pick_performance: {
        Row: {
          avg_consensus_score: number | null
          avg_consensus_score_on_wins: number | null
          grade: Database["public"]["Enums"]["grade_letter_enum"] | null
          losses: number | null
          pushes: number | null
          sport: Database["public"]["Enums"]["sport_enum"] | null
          total_picks: number | null
          total_profit: number | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_bankroll: {
        Args: {
          delta: number
          losses?: number
          pushes?: number
          user_id: string
          wins?: number
        }
        Returns: undefined
      }
      calculate_pick_result: {
        Args: {
          p_game_id: string
          p_line: number
          p_side: Database["public"]["Enums"]["pick_side_enum"]
        }
        Returns: Database["public"]["Enums"]["pick_result_enum"]
      }
      increment_bankroll_field: {
        Args: { delta: number; field: string; user_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      prewarm_slate: { Args: never; Returns: string }
      settle_picks: { Args: never; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_odds: { Args: never; Returns: string }
    }
    Enums: {
      convergence_status_enum: "aligned" | "divergent" | "uncertain" | "pending"
      edge_signal_enum:
        | "reverse_line"
        | "injury_lag"
        | "sharp_money"
        | "public_fade"
        | "line_stall"
        | "opening_value"
        | "grading_divergence"
        | "consensus_edge"
      edge_status_enum: "active" | "exploited" | "expired" | "voided"
      game_status_enum:
        | "scheduled"
        | "live"
        | "completed"
        | "postponed"
        | "cancelled"
      grade_letter_enum:
        | "A+"
        | "A"
        | "A-"
        | "B+"
        | "B"
        | "B-"
        | "C+"
        | "C"
        | "C-"
        | "D+"
        | "D"
        | "D-"
        | "F"
      movement_type_enum: "spread" | "total" | "ml_home" | "ml_away"
      pick_result_enum: "win" | "loss" | "push" | "pending" | "void"
      pick_side_enum:
        | "home"
        | "away"
        | "over"
        | "under"
        | "draw"
        | "btts_yes"
        | "btts_no"
      pick_type_enum: "spread" | "ml" | "total" | "btts"
      sport_enum:
        | "nba"
        | "nhl"
        | "mlb"
        | "nfl"
        | "ncaab"
        | "ncaaf"
        | "soccer"
        | "mma"
        | "boxing"
        | "golf"
        | "wnba"
        | "tennis"
        | "college_baseball"
      user_role_enum: "user" | "admin"
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
    Enums: {
      convergence_status_enum: ["aligned", "divergent", "uncertain", "pending"],
      edge_signal_enum: [
        "reverse_line",
        "injury_lag",
        "sharp_money",
        "public_fade",
        "line_stall",
        "opening_value",
        "grading_divergence",
        "consensus_edge",
      ],
      edge_status_enum: ["active", "exploited", "expired", "voided"],
      game_status_enum: [
        "scheduled",
        "live",
        "completed",
        "postponed",
        "cancelled",
      ],
      grade_letter_enum: [
        "A+",
        "A",
        "A-",
        "B+",
        "B",
        "B-",
        "C+",
        "C",
        "C-",
        "D+",
        "D",
        "D-",
        "F",
      ],
      movement_type_enum: ["spread", "total", "ml_home", "ml_away"],
      pick_result_enum: ["win", "loss", "push", "pending", "void"],
      pick_side_enum: [
        "home",
        "away",
        "over",
        "under",
        "draw",
        "btts_yes",
        "btts_no",
      ],
      pick_type_enum: ["spread", "ml", "total", "btts"],
      sport_enum: [
        "nba",
        "nhl",
        "mlb",
        "nfl",
        "ncaab",
        "ncaaf",
        "soccer",
        "mma",
        "boxing",
        "golf",
        "wnba",
        "tennis",
        "college_baseball",
      ],
      user_role_enum: ["user", "admin"],
    },
  },
} as const
