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
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          environment: string
          id: string
          institution_id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          revoked_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          institution_id: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          label?: string
          last_used_at?: string | null
          revoked_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          institution_id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          endpoint: string
          environment: string
          id: string
          institution_id: string
          ip_address: string | null
          latency_ms: number | null
          method: string
          request_body: Json | null
          response_body: Json | null
          status_code: number
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          endpoint: string
          environment?: string
          id?: string
          institution_id: string
          ip_address?: string | null
          latency_ms?: number | null
          method: string
          request_body?: Json | null
          response_body?: Json | null
          status_code: number
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          endpoint?: string
          environment?: string
          id?: string
          institution_id?: string
          ip_address?: string | null
          latency_ms?: number | null
          method?: string
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_request_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          alt_data_consents: Json | null
          app_code: string
          borrower_id: string
          bureau_score: number | null
          collateral: string | null
          country: string
          created_at: string
          created_by: string | null
          currency: string | null
          dependents: number | null
          documents: Json | null
          employer: string | null
          existing_loans: string | null
          export_income_pct: number | null
          id: string
          institution_id: string
          monthly_expenses: number | null
          monthly_income: number | null
          monthly_rent: number | null
          monthly_revenue: number | null
          notes: string | null
          probability_of_default: number | null
          product_category: Database["public"]["Enums"]["product_category"]
          product_type: string | null
          psychometric_method: string | null
          psychometric_phone: string | null
          psychometric_status: string | null
          purpose: string | null
          reason_codes: Json | null
          requested_amount: number | null
          score: number | null
          score_band: string | null
          scored_at: string | null
          status: Database["public"]["Enums"]["application_status"]
          tenor_months: number | null
          updated_at: string
          usd_income: number | null
          usd_revenue: number | null
        }
        Insert: {
          alt_data_consents?: Json | null
          app_code?: string
          borrower_id: string
          bureau_score?: number | null
          collateral?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          dependents?: number | null
          documents?: Json | null
          employer?: string | null
          existing_loans?: string | null
          export_income_pct?: number | null
          id?: string
          institution_id: string
          monthly_expenses?: number | null
          monthly_income?: number | null
          monthly_rent?: number | null
          monthly_revenue?: number | null
          notes?: string | null
          probability_of_default?: number | null
          product_category?: Database["public"]["Enums"]["product_category"]
          product_type?: string | null
          psychometric_method?: string | null
          psychometric_phone?: string | null
          psychometric_status?: string | null
          purpose?: string | null
          reason_codes?: Json | null
          requested_amount?: number | null
          score?: number | null
          score_band?: string | null
          scored_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          tenor_months?: number | null
          updated_at?: string
          usd_income?: number | null
          usd_revenue?: number | null
        }
        Update: {
          alt_data_consents?: Json | null
          app_code?: string
          borrower_id?: string
          bureau_score?: number | null
          collateral?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          dependents?: number | null
          documents?: Json | null
          employer?: string | null
          existing_loans?: string | null
          export_income_pct?: number | null
          id?: string
          institution_id?: string
          monthly_expenses?: number | null
          monthly_income?: number | null
          monthly_rent?: number | null
          monthly_revenue?: number | null
          notes?: string | null
          probability_of_default?: number | null
          product_category?: Database["public"]["Enums"]["product_category"]
          product_type?: string | null
          psychometric_method?: string | null
          psychometric_phone?: string | null
          psychometric_status?: string | null
          purpose?: string | null
          reason_codes?: Json | null
          requested_amount?: number | null
          score?: number | null
          score_band?: string | null
          scored_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          tenor_months?: number | null
          updated_at?: string
          usd_income?: number | null
          usd_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowers: {
        Row: {
          address: string | null
          business_name: string | null
          business_registration: string | null
          business_type: string | null
          country: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          employees: number | null
          extra_data: Json | null
          full_name: string
          gender: string | null
          id: string
          id_number: string | null
          id_type: string | null
          institution_id: string
          location_detail: string | null
          marital_status: string | null
          phone: string | null
          sector: string | null
          social_id: string | null
          tax_id: string | null
          updated_at: string
          years_in_operation: number | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          business_registration?: string | null
          business_type?: string | null
          country: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employees?: number | null
          extra_data?: Json | null
          full_name: string
          gender?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          institution_id: string
          location_detail?: string | null
          marital_status?: string | null
          phone?: string | null
          sector?: string | null
          social_id?: string | null
          tax_id?: string | null
          updated_at?: string
          years_in_operation?: number | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          business_registration?: string | null
          business_type?: string | null
          country?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employees?: number | null
          extra_data?: Json | null
          full_name?: string
          gender?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          institution_id?: string
          location_detail?: string | null
          marital_status?: string | null
          phone?: string | null
          sector?: string | null
          social_id?: string | null
          tax_id?: string | null
          updated_at?: string
          years_in_operation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "borrowers_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extractions: {
        Row: {
          application_id: string
          confidence_score: number | null
          created_at: string
          document_type: string
          error_message: string | null
          extracted_data: Json | null
          extraction_status: string
          id: string
          institution_id: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          application_id: string
          confidence_score?: number | null
          created_at?: string
          document_type: string
          error_message?: string | null
          extracted_data?: Json | null
          extraction_status?: string
          id?: string
          institution_id: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          confidence_score?: number | null
          created_at?: string
          document_type?: string
          error_message?: string | null
          extracted_data?: Json | null
          extraction_status?: string
          id?: string
          institution_id?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extractions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      income_history: {
        Row: {
          borrower_id: string
          created_at: string
          currency: string
          id: string
          income_amount: number
          income_source: string | null
          institution_id: string
          period_end: string
          period_start: string
          verified: boolean | null
        }
        Insert: {
          borrower_id: string
          created_at?: string
          currency?: string
          id?: string
          income_amount: number
          income_source?: string | null
          institution_id: string
          period_end: string
          period_start: string
          verified?: boolean | null
        }
        Update: {
          borrower_id?: string
          created_at?: string
          currency?: string
          id?: string
          income_amount?: number
          income_source?: string | null
          institution_id?: string
          period_end?: string
          period_start?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "income_history_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_history_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          country: string
          created_at: string
          id: string
          name: string
          products: number
          status: string
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          name: string
          products?: number
          status?: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          name?: string
          products?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount_due: number
          amount_paid: number | null
          application_id: string | null
          borrower_id: string
          created_at: string
          currency: string
          days_past_due: number | null
          due_date: string
          id: string
          installment_number: number
          institution_id: string
          loan_amount: number
          paid_date: string | null
          status: string
          total_installments: number
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          application_id?: string | null
          borrower_id: string
          created_at?: string
          currency?: string
          days_past_due?: number | null
          due_date: string
          id?: string
          installment_number: number
          institution_id: string
          loan_amount: number
          paid_date?: string | null
          status?: string
          total_installments: number
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          application_id?: string | null
          borrower_id?: string
          created_at?: string
          currency?: string
          days_past_due?: number | null
          due_date?: string
          id?: string
          installment_number?: number
          institution_id?: string
          loan_amount?: number
          paid_date?: string | null
          status?: string
          total_installments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          institution_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          institution_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          institution_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecard_results: {
        Row: {
          ai_insights: Json | null
          application_id: string
          base_score: number
          feature_contributions: Json
          final_score: number
          id: string
          model_version: string
          probability_of_default: number
          recommendation: string
          score_band: string
          scored_at: string
          summary: string | null
          time_series_features: Json
          woe_details: Json
        }
        Insert: {
          ai_insights?: Json | null
          application_id: string
          base_score: number
          feature_contributions?: Json
          final_score: number
          id?: string
          model_version?: string
          probability_of_default: number
          recommendation: string
          score_band: string
          scored_at?: string
          summary?: string | null
          time_series_features?: Json
          woe_details?: Json
        }
        Update: {
          ai_insights?: Json | null
          application_id?: string
          base_score?: number
          feature_contributions?: Json
          final_score?: number
          id?: string
          model_version?: string
          probability_of_default?: number
          recommendation?: string
          score_band?: string
          scored_at?: string
          summary?: string | null
          time_series_features?: Json
          woe_details?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scorecard_results_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          institution_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          institution_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          institution_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          created_at: string
          environment: string
          events: string[]
          id: string
          institution_id: string
          is_active: boolean
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          environment?: string
          events?: string[]
          id?: string
          institution_id: string
          is_active?: boolean
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          environment?: string
          events?: string[]
          id?: string
          institution_id?: string
          is_active?: boolean
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_institution_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "credit_officer" | "underwriter" | "viewer"
      application_status:
        | "draft"
        | "submitted"
        | "review"
        | "approved"
        | "declined"
        | "disbursed"
      product_category: "retail" | "micro" | "sme"
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
      app_role: ["admin", "credit_officer", "underwriter", "viewer"],
      application_status: [
        "draft",
        "submitted",
        "review",
        "approved",
        "declined",
        "disbursed",
      ],
      product_category: ["retail", "micro", "sme"],
    },
  },
} as const
