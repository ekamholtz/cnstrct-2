export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      account_subscriptions: {
        Row: {
          created_at: string
          end_date: string
          gc_account_id: string
          id: string
          start_date: string
          status: "active" | "cancelled" | "past_due" | "trialing"
          tier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          gc_account_id: string
          id?: string
          start_date: string
          status: "active" | "cancelled" | "past_due" | "trialing"
          tier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          gc_account_id?: string
          id?: string
          start_date?: string
          status?: "active" | "cancelled" | "past_due" | "trialing"
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_subscriptions_gc_account_id_fkey"
            columns: ["gc_account_id"]
            referencedRelation: "gc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          }
        ]
      }
      
      expenses: {
        Row: {
          id: string
          project_id: string
          name: string
          payee: string
          amount: number
          amount_due?: number
          expense_date: string
          expense_type: string
          payment_status: string
          expense_number?: string
          notes?: string
          created_at: string
          updated_at: string
          gc_account_id?: string
          user_id?: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          payee: string
          amount: number
          amount_due?: number
          expense_date: string
          expense_type: string
          payment_status: string
          expense_number?: string
          notes?: string
          created_at?: string
          updated_at?: string
          gc_account_id?: string
          user_id?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          payee?: string
          amount?: number
          amount_due?: number
          expense_date?: string
          expense_type?: string
          payment_status?: string
          expense_number?: string
          notes?: string
          created_at?: string
          updated_at?: string
          gc_account_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      
      payments: {
        Row: {
          id: string
          expense_id?: string
          invoice_id?: string
          direction: string
          amount: number
          payment_method_code: string
          payment_reference: string
          status: string
          payment_processor_id?: string
          processor_transaction_id?: string
          processor_metadata?: Json
          simulation_mode: boolean
          simulation_data?: Json
          notes?: string
          payment_date: string
          created_at: string
          updated_at: string
          gc_account_id?: string
        }
        Insert: {
          id?: string
          expense_id?: string
          invoice_id?: string
          direction: string
          amount: number
          payment_method_code: string
          payment_reference: string
          status: string
          payment_processor_id?: string
          processor_transaction_id?: string
          processor_metadata?: Json
          simulation_mode: boolean
          simulation_data?: Json
          notes?: string
          payment_date: string
          created_at?: string
          updated_at?: string
          gc_account_id?: string
        }
        Update: {
          id?: string
          expense_id?: string
          invoice_id?: string
          direction?: string
          amount?: number
          payment_method_code?: string
          payment_reference?: string
          status?: string
          payment_processor_id?: string
          processor_transaction_id?: string
          processor_metadata?: Json
          simulation_mode?: boolean
          simulation_data?: Json
          notes?: string
          payment_date?: string
          created_at?: string
          updated_at?: string
          gc_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_expense_id_fkey"
            columns: ["expense_id"]
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          }
        ]
      }
      
      clients: {
        Row: {
          id: string
          gc_account_id?: string
          name: string
          email: string
          phone?: string
          address?: string
          user_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gc_account_id?: string
          name: string
          email: string
          phone?: string
          address?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gc_account_id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      
      profiles: {
        Row: {
          id: string
          gc_account_id?: string
          full_name: string
          email?: string
          role: UserRole
          company_name?: string
          phone_number?: string
          address?: string
          license_number?: string
          website?: string
          bio?: string
          account_status: string
          has_completed_profile: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          gc_account_id?: string
          full_name: string
          email?: string
          role: UserRole
          company_name?: string
          phone_number?: string
          address?: string
          license_number?: string
          website?: string
          bio?: string
          account_status?: string
          has_completed_profile?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gc_account_id?: string
          full_name?: string
          email?: string
          role?: UserRole
          company_name?: string
          phone_number?: string
          address?: string
          license_number?: string
          website?: string
          bio?: string
          account_status?: string
          has_completed_profile?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      
      projects: {
        Row: {
          id: string
          gc_account_id?: string
          name: string
          description?: string
          address?: string
          status: string
          start_date?: string
          end_date?: string
          budget?: number
          owner_user_id?: string
          contractor_id?: string
          pm_user_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gc_account_id?: string
          name: string
          description?: string
          address?: string
          status: string
          start_date?: string
          end_date?: string
          budget?: number
          owner_user_id?: string
          contractor_id?: string
          pm_user_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gc_account_id?: string
          name?: string
          description?: string
          address?: string
          status?: string
          start_date?: string
          end_date?: string
          budget?: number
          owner_user_id?: string
          contractor_id?: string
          pm_user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_gc_account_id_fkey"
            columns: ["gc_account_id"]
            referencedRelation: "gc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_user_id_fkey"
            columns: ["owner_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contractor_id_fkey"
            columns: ["contractor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_pm_user_id_fkey"
            columns: ["pm_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      
      milestones: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          status: string
          due_date: string | null
          amount: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          status?: string
          due_date?: string | null
          amount: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          status?: string
          due_date?: string | null
          amount?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      
      gc_accounts: {
        Row: {
          company_name: string
          created_at: string | null
          id: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gc_accounts_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      
      homeowner_expenses: {
        Row: {
          id: string
          project_id: string
          homeowner_id: string
          name: string
          payee: string
          amount: number
          amount_due?: number
          expense_date: string
          expense_type: string
          payment_status: string
          expense_number?: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          homeowner_id: string
          name: string
          payee: string
          amount: number
          amount_due?: number
          expense_date: string
          expense_type: string
          payment_status: string
          expense_number?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          homeowner_id?: string
          name?: string
          payee?: string
          amount?: number
          amount_due?: number
          expense_date?: string
          expense_type?: string
          payment_status?: string
          expense_number?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_expenses_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_expenses_homeowner_id_fkey"
            columns: ["homeowner_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      
      invoices: {
        Row: {
          id: string
          invoice_number: string
          amount: number
          status: string
          project_id: string
          milestone_id?: string
          payment_method?: string
          payment_date?: string
          payment_reference?: string
          payment_gateway?: string
          simulation_data?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          amount: number
          status: string
          project_id: string
          milestone_id?: string
          payment_method?: string
          payment_date?: string
          payment_reference?: string
          payment_gateway?: string
          simulation_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          amount?: number
          status?: string
          project_id?: string
          milestone_id?: string
          payment_method?: string
          payment_date?: string
          payment_reference?: string
          payment_gateway?: string
          simulation_data?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_milestone_id_fkey"
            columns: ["milestone_id"]
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          }
        ]
      }
      
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          entity_type: string
          entity_id: string
          action_type: string
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          entity_type: string
          entity_id: string
          action_type: string
          details: Json
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          entity_type?: string
          entity_id?: string
          action_type?: string
          details?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      
      supported_payment_methods: {
        Row: {
          code: string
          name: string
          description?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          name: string
          description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          name?: string
          description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      
      qbo_connections: {
        Row: {
          id: string
          user_id: string
          company_id: string
          company_name: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          company_name: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          company_name?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_connections_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      qbo_references: {
        Row: {
          id: string
          user_id: string
          qbo_company_id: string
          local_entity_id: string
          local_entity_type: string
          qbo_entity_id: string
          qbo_entity_type: string
          sync_status: string
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          qbo_company_id: string
          local_entity_id: string
          local_entity_type: string
          qbo_entity_id: string
          qbo_entity_type: string
          sync_status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          qbo_company_id?: string
          local_entity_id?: string
          local_entity_type?: string
          qbo_entity_id?: string
          qbo_entity_type?: string
          sync_status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_references_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      qbo_sync_logs: {
        Row: {
          id: string
          user_id: string
          qbo_reference_id: string | null
          action: string
          status: string
          payload: Json | null
          response: Json | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          qbo_reference_id?: string | null
          action: string
          status: string
          payload?: Json | null
          response?: Json | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          qbo_reference_id?: string | null
          action?: string
          status?: string
          payload?: Json | null
          response?: Json | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_sync_logs_qbo_reference_id_fkey"
            columns: ["qbo_reference_id"]
            referencedRelation: "qbo_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qbo_sync_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      project_commission_settings: {
        Row: {
          id: string
          project_id: string
          office_overhead_percentage: number
          pm_profit_split_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          office_overhead_percentage: number
          pm_profit_split_percentage: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          office_overhead_percentage?: number
          pm_profit_split_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_commission_settings_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Enums: {
      homeowner_expense_type: "materials" | "labor" | "subcontractor" | "other",
      milestones_status: "pending" | "in_progress" | "completed",
      invoice_status: "pending_payment" | "paid" | "cancelled",
      UserRole: "client" | "contractor" | "employee" | "homeowner" | "gc_admin" | "platform_admin" | "project_manager"
    }
  }
}

export type UserRole = Database["public"]["Enums"]["UserRole"];
