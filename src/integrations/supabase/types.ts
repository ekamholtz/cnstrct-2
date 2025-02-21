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
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          tier_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          gc_account_id?: string | null
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          gc_account_id?: string | null
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_subscriptions_gc_account_id_fkey"
            columns: ["gc_account_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
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
          created_at: string
          email: string
          id: string
          name: string
          phone_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          amount_due: number
          contractor_id: string
          created_at: string
          expense_date: string
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          name: string
          notes: string | null
          payee: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          project_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          amount_due?: number
          contractor_id: string
          created_at?: string
          expense_date: string
          expense_type?: Database["public"]["Enums"]["expense_type"]
          id?: string
          name: string
          notes?: string | null
          payee: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          project_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_due?: number
          contractor_id?: string
          created_at?: string
          expense_date?: string
          expense_type?: Database["public"]["Enums"]["expense_type"]
          id?: string
          name?: string
          notes?: string | null
          payee?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          project_id?: string
          updated_at?: string
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
      invitation_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          invited_by: string | null
          profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          invited_by?: string | null
          profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          invited_by?: string | null
          profile_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          contractor_id: string
          created_at: string
          id: string
          invoice_number: string
          milestone_id: string
          payment_date: string | null
          payment_gateway: string | null
          payment_method: string | null
          payment_method_type: string | null
          payment_reference: string | null
          project_id: string
          simulation_data: Json | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          contractor_id: string
          created_at?: string
          id?: string
          invoice_number: string
          milestone_id: string
          payment_date?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_method_type?: string | null
          payment_reference?: string | null
          project_id: string
          simulation_data?: Json | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          contractor_id?: string
          created_at?: string
          id?: string
          invoice_number?: string
          milestone_id?: string
          payment_date?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_method_type?: string | null
          payment_reference?: string | null
          project_id?: string
          simulation_data?: Json | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
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
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"] | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          updated_at?: string
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
          created_at: string
          expense_id: string
          id: string
          payment_amount: number
          payment_date: string
          payment_type: Database["public"]["Enums"]["expense_payment_method"]
          simulation_data: Json | null
          updated_at: string
          vendor_email: string | null
          vendor_phone: string | null
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          payment_amount: number
          payment_date: string
          payment_type: Database["public"]["Enums"]["expense_payment_method"]
          simulation_data?: Json | null
          updated_at?: string
          vendor_email?: string | null
          vendor_phone?: string | null
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          payment_amount?: number
          payment_date?: string
          payment_type?: Database["public"]["Enums"]["expense_payment_method"]
          simulation_data?: Json | null
          updated_at?: string
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
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          feature_key: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature_key: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature_key?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          address: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          full_name: string
          gc_account_id: string | null
          has_completed_profile: boolean | null
          id: string
          license_number: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_status?: string
          address?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string
          gc_account_id?: string | null
          has_completed_profile?: boolean | null
          id: string
          license_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_status?: string
          address?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string
          gc_account_id?: string | null
          has_completed_profile?: boolean | null
          id?: string
          license_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gc_account_id_fkey"
            columns: ["gc_account_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string
          client_id: string | null
          contractor_id: string
          created_at: string
          id: string
          name: string
          pm_user_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          address: string
          client_id?: string | null
          contractor_id: string
          created_at?: string
          id?: string
          name: string
          pm_user_id?: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          client_id?: string | null
          contractor_id?: string
          created_at?: string
          id?: string
          name?: string
          pm_user_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
            foreignKeyName: "tier_features_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_features_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
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
      check_is_admin: {
        Args: {
          user_id: string
        }
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
      get_project_invoices: {
        Args: {
          p_id: string
        }
        Returns: {
          id: string
          invoice_number: string
          amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          created_at: string
          updated_at: string
          payment_method: string
          payment_date: string
          payment_reference: string
          payment_gateway: string
          milestone_id: string
          milestone_name: string
          project_name: string
          project_id: string
        }[]
      }
      get_user_profile: {
        Args: {
          user_id: string
        }
        Returns: {
          account_status: string
          address: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          full_name: string
          gc_account_id: string | null
          has_completed_profile: boolean | null
          id: string
          license_number: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          website: string | null
        }[]
      }
      handle_user_invitation: {
        Args: {
          inviter_id: string
          user_email: string
          user_full_name: string
          user_phone: string
          user_role: Database["public"]["Enums"]["user_role"]
          invite_expires_in?: unknown
        }
        Returns: string
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
      user_role: "admin" | "gc_admin" | "project_manager" | "homeowner"
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
