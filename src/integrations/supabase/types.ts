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
      account_subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          gc_account_id: string | null
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          tier_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          gc_account_id?: string | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          tier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          gc_account_id?: string | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          tier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      admin_stats_cache: {
        Row: {
          id: string
          last_updated: string | null
          stat_type: string
          value: number
        }
        Insert: {
          id?: string
          last_updated?: string | null
          stat_type: string
          value: number
        }
        Update: {
          id?: string
          last_updated?: string | null
          stat_type?: string
          value?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string
          created_at: string | null
          email: string
          id: string
          name: string
          phone_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          amount_due: number
          contractor_id: string
          created_at: string | null
          expense_date: string
          expense_type: Database["public"]["Enums"]["expense_type"] | null
          id: string
          name: string
          notes: string | null
          payee: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_due?: number
          contractor_id: string
          created_at?: string | null
          expense_date: string
          expense_type?: Database["public"]["Enums"]["expense_type"] | null
          id?: string
          name: string
          notes?: string | null
          payee: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_due?: number
          contractor_id?: string
          created_at?: string | null
          expense_date?: string
          expense_type?: Database["public"]["Enums"]["expense_type"] | null
          id?: string
          name?: string
          notes?: string | null
          payee?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          contractor_id: string
          created_at: string | null
          id: string
          invoice_number: string
          milestone_id: string
          payment_date: string | null
          payment_gateway: string | null
          payment_method: string | null
          payment_reference: string | null
          project_id: string
          simulation_data: Json | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          contractor_id: string
          created_at?: string | null
          id?: string
          invoice_number: string
          milestone_id: string
          payment_date?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          project_id: string
          simulation_data?: Json | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contractor_id?: string
          created_at?: string | null
          id?: string
          invoice_number?: string
          milestone_id?: string
          payment_date?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          project_id?: string
          simulation_data?: Json | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string | null
          expense_id: string
          id: string
          payment_amount: number
          payment_date: string
          payment_type: Database["public"]["Enums"]["expense_payment_method"]
          simulation_data: Json | null
          updated_at: string | null
          vendor_email: string | null
          vendor_phone: string | null
        }
        Insert: {
          created_at?: string | null
          expense_id: string
          id?: string
          payment_amount: number
          payment_date: string
          payment_type: Database["public"]["Enums"]["expense_payment_method"]
          simulation_data?: Json | null
          updated_at?: string | null
          vendor_email?: string | null
          vendor_phone?: string | null
        }
        Update: {
          created_at?: string | null
          expense_id?: string
          id?: string
          payment_amount?: number
          payment_date?: string
          payment_type?: Database["public"]["Enums"]["expense_payment_method"]
          simulation_data?: Json | null
          updated_at?: string | null
          vendor_email?: string | null
          vendor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          bio: string | null
          company_name: string | null
          created_at: string | null
          full_name: string
          gc_account_id: string | null
          has_completed_profile: boolean | null
          id: string
          license_number: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_status?: string
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name: string
          gc_account_id?: string | null
          has_completed_profile?: boolean | null
          id: string
          license_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_status?: string
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string
          gc_account_id?: string | null
          has_completed_profile?: boolean | null
          id?: string
          license_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          address: string
          client_id: string | null
          contractor_id: string
          created_at: string | null
          id: string
          name: string
          pm_user_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string | null
        }
        Insert: {
          address: string
          client_id?: string | null
          contractor_id: string
          created_at?: string | null
          id?: string
          name: string
          pm_user_id?: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at?: string | null
        }
        Update: {
          address?: string
          client_id?: string | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          name?: string
          pm_user_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      tier_features: {
        Row: {
          created_at: string | null
          permission_id: string
          tier_id: string
          usage_limit: number | null
        }
        Insert: {
          created_at?: string | null
          permission_id: string
          tier_id: string
          usage_limit?: number | null
        }
        Update: {
          created_at?: string | null
          permission_id?: string
          tier_id?: string
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_features_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      check_is_admin_no_recursion: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_is_gc_admin_no_recursion: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_profile_completion_no_recursion: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_invoice_number:
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
        | {
            Args: {
              milestone_id: string
            }
            Returns: string
          }
      get_user_permissions: {
        Args: {
          user_id: string
        }
        Returns: {
          feature_key: string
        }[]
      }
      has_permission: {
        Args: {
          user_id: string
          feature_key: string
        }
        Returns: boolean
      }
      has_project_access: {
        Args: {
          project_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_gc_admin_of: {
        Args: {
          profile_id: string
        }
        Returns: boolean
      }
      simulate_invoice_payment: {
        Args: {
          invoice_id: string
          simulation_details: Json
        }
        Returns: undefined
      }
      undo_milestone_completion: {
        Args: {
          milestone_id_param: string
        }
        Returns: boolean
      }
      update_active_projects_stat: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_total_revenue_stat: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_total_users_stat: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      expense_payment_method: "cc" | "check" | "transfer" | "cash"
      expense_type: "labor" | "materials" | "subcontractor" | "other"
      invoice_status: "pending_payment" | "paid" | "cancelled"
      milestone_status: "pending" | "completed"
      payment_method: "cc" | "check" | "transfer" | "cash"
      payment_method_type: "cc" | "check" | "transfer" | "cash" | "simulated"
      payment_status: "due" | "partially_paid" | "paid"
      project_status: "draft" | "active" | "completed" | "cancelled"
      subscription_status: "active" | "cancelled" | "past_due" | "trialing"
      user_role: "platform_admin" | "gc_admin" | "project_manager" | "homeowner"
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
