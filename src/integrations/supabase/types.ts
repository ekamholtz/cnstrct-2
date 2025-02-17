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
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          contractor_id: string
          created_at: string
          expense_date: string
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          name: string
          notes: string | null
          payee: string
          payment_status: string
          payment_type: Database["public"]["Enums"]["expense_payment_method"]
          project_id: string
          updated_at: string
          vendor_email: string | null
        }
        Insert: {
          amount: number
          contractor_id: string
          created_at?: string
          expense_date: string
          expense_type?: Database["public"]["Enums"]["expense_type"]
          id?: string
          name: string
          notes?: string | null
          payee: string
          payment_status?: string
          payment_type: Database["public"]["Enums"]["expense_payment_method"]
          project_id: string
          updated_at?: string
          vendor_email?: string | null
        }
        Update: {
          amount?: number
          contractor_id?: string
          created_at?: string
          expense_date?: string
          expense_type?: Database["public"]["Enums"]["expense_type"]
          id?: string
          name?: string
          notes?: string | null
          payee?: string
          payment_status?: string
          payment_type?: Database["public"]["Enums"]["expense_payment_method"]
          project_id?: string
          updated_at?: string
          vendor_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          created_at: string
          id: string
          invoice_number: string
          milestone_id: string
          payment_date: string | null
          payment_gateway: string | null
          payment_method: string | null
          payment_method_type:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
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
          payment_method_type?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
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
          payment_method_type?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          payment_reference?: string | null
          project_id?: string
          simulation_data?: Json | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          amount: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"] | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
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
      profiles: {
        Row: {
          account_status: string
          address: string | null
          bank_account_number: string | null
          bank_routing_number: string | null
          bio: string | null
          company_address: string | null
          company_name: string | null
          created_at: string
          email_confirmed_at: string | null
          full_name: string
          has_completed_profile: boolean | null
          id: string
          join_date: string | null
          license_number: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_status?: string
          address?: string | null
          bank_account_number?: string | null
          bank_routing_number?: string | null
          bio?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          email_confirmed_at?: string | null
          full_name?: string
          has_completed_profile?: boolean | null
          id: string
          join_date?: string | null
          license_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_status?: string
          address?: string | null
          bank_account_number?: string | null
          bank_routing_number?: string | null
          bio?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          email_confirmed_at?: string | null
          full_name?: string
          has_completed_profile?: boolean | null
          id?: string
          join_date?: string | null
          license_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          address: string
          client_id: string | null
          contractor_id: string
          created_at: string
          id: string
          name: string
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
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contractor_id_fkey"
            columns: ["contractor_id"]
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
      has_project_access: {
        Args: {
          project_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: {
          user_id: string
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
      payment_method_type: "cc" | "check" | "transfer" | "cash" | "simulated"
      project_status: "draft" | "active" | "completed" | "cancelled"
      user_role: "general_contractor" | "homeowner" | "admin"
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
