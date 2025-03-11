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
          id: string
          gc_account_id: string
          tier_id: string
          status: "active" | "cancelled" | "past_due" | "trialing"
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          gc_account_id: string
          tier_id: string
          status: "active" | "cancelled" | "past_due" | "trialing"
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gc_account_id?: string
          tier_id?: string
          status?: "active" | "cancelled" | "past_due" | "trialing"
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_subscriptions_gc_account_id_fkey"
            columns: ["gc_account_id"]
            referencedRelation: "gc_accounts"
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
          contractor_id?: string
          gc_account_id?: string
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
          contractor_id?: string
          gc_account_id?: string
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
          contractor_id?: string
          gc_account_id?: string
        }
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
          payment_date: string
          notes?: string
          simulation_mode: boolean
          gc_account_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          expense_id?: string
          invoice_id?: string
          direction: string
          amount: number
          payment_method_code: string
          payment_reference: string
          status: string
          payment_processor_id?: string
          payment_date: string
          notes?: string
          simulation_mode: boolean
          gc_account_id?: string
          created_at?: string
          updated_at?: string
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
          payment_date?: string
          notes?: string
          simulation_mode?: boolean
          gc_account_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone_number: string | null
          role: "homeowner" | "contractor" | "project_manager" | "gc_admin" | "platform_admin"
          gc_account_id: string
          company_name: string | null
          license_number: string | null
          address: string | null
          website: string | null
          bio: string | null
          has_completed_profile: boolean
          account_status: string | null
          created_at: string | null
          updated_at: string | null
          is_owner: boolean | null
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone_number?: string | null
          role: "homeowner" | "contractor" | "project_manager" | "gc_admin" | "platform_admin"
          gc_account_id: string
          company_name?: string | null
          license_number?: string | null
          address?: string | null
          website?: string | null
          bio?: string | null
          has_completed_profile?: boolean
          account_status?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_owner?: boolean | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone_number?: string | null
          role?: "homeowner" | "contractor" | "project_manager" | "gc_admin" | "platform_admin"
          gc_account_id?: string
          company_name?: string | null
          license_number?: string | null
          address?: string | null
          website?: string | null
          bio?: string | null
          has_completed_profile?: boolean
          account_status?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_owner?: boolean | null
        }
      }
      qbo_connections: {
        Row: {
          id: string
          gc_account_id: string
          access_token: string
          refresh_token: string
          realm_id: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          gc_account_id: string
          access_token: string
          refresh_token: string
          realm_id: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gc_account_id?: string
          access_token?: string
          refresh_token?: string
          realm_id?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      qbo_references: {
        Row: {
          id: string
          gc_account_id: string
          entity_type: string
          gc_entity_id: string
          qbo_entity_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          gc_account_id: string
          entity_type: string
          gc_entity_id: string
          qbo_entity_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gc_account_id?: string
          entity_type?: string
          gc_entity_id?: string
          qbo_entity_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      qbo_sync_logs: {
        Row: {
          id: string
          gc_account_id: string
          entity_type: string
          entity_id: string
          status: string
          message: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          gc_account_id: string
          entity_type: string
          entity_id: string
          status: string
          message: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gc_account_id?: string
          entity_type?: string
          entity_id?: string
          status?: string
          message?: string
          created_at?: string
          updated_at?: string
        }
      }
      gc_accounts: {
        Row: {
          id: string
          name: string
          account_status: string
          created_at: string
          updated_at: string
          owner_user_id?: string
        }
        Insert: {
          id?: string
          name: string
          account_status?: string
          created_at?: string
          updated_at?: string
          owner_user_id?: string
        }
        Update: {
          id?: string
          name?: string
          account_status?: string
          created_at?: string
          updated_at?: string
          owner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gc_accounts_owner_user_id_fkey"
            columns: ["owner_user_id"]
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
          description?: string
          amount: number
          due_date?: string
          status: string
          order_index: number
          created_at: string
          updated_at: string
          invoice_id?: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string
          amount: number
          due_date?: string
          status?: string
          order_index?: number
          created_at?: string
          updated_at?: string
          invoice_id?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string
          amount?: number
          due_date?: string
          status?: string
          order_index?: number
          created_at?: string
          updated_at?: string
          invoice_id?: string
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
      clients: {
        Row: {
          id: string
          name: string
          email?: string
          phone?: string
          address?: string
          notes?: string
          gc_account_id: string
          created_at: string
          updated_at: string
          client_user_id?: string
        }
        Insert: {
          id?: string
          name: string
          email?: string
          phone?: string
          address?: string
          notes?: string
          gc_account_id: string
          created_at?: string
          updated_at?: string
          client_user_id?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          notes?: string
          gc_account_id?: string
          created_at?: string
          updated_at?: string
          client_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_gc_account_id_fkey"
            columns: ["gc_account_id"]
            referencedRelation: "gc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_client_user_id_fkey"
            columns: ["client_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      homeowner_expenses: {
        Row: {
          id: string
          project_id: string
          name: string
          amount: number
          expense_date: string
          notes?: string
          created_at: string
          updated_at: string
          client_id?: string
          receipt_url?: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          amount: number
          expense_date: string
          notes?: string
          created_at?: string
          updated_at?: string
          client_id?: string
          receipt_url?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          amount?: number
          expense_date?: string
          notes?: string
          created_at?: string
          updated_at?: string
          client_id?: string
          receipt_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_expenses_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_expenses_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          client_id: string
          project_id: string
          invoice_number?: string
          description?: string
          amount: number
          invoice_date?: string
          due_date?: string
          status: string
          notes?: string
          created_at: string
          updated_at: string
          milestone_id?: string
          payment_method?: string
          payment_date?: string
          payment_reference?: string
          payment_gateway?: string
          payment_method_type?: string
          simulation_data?: Json
        }
        Insert: {
          id?: string
          client_id: string
          project_id: string
          invoice_number?: string
          description?: string
          amount: number
          invoice_date?: string
          due_date?: string
          status?: string
          notes?: string
          created_at?: string
          updated_at?: string
          milestone_id?: string
          payment_method?: string
          payment_date?: string
          payment_reference?: string
          payment_gateway?: string
          payment_method_type?: string
          simulation_data?: Json
        }
        Update: {
          id?: string
          client_id?: string
          project_id?: string
          invoice_number?: string
          description?: string
          amount?: number
          invoice_date?: string
          due_date?: string
          status?: string
          notes?: string
          created_at?: string
          updated_at?: string
          milestone_id?: string
          payment_method?: string
          payment_date?: string
          payment_reference?: string
          payment_gateway?: string
          payment_method_type?: string
          simulation_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      project_users: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          project_id: string
          user_id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_users_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          action_type: string
          target_table: string
          target_id: string
          details: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action_type: string
          target_table: string
          target_id: string
          details: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action_type?: string
          target_table?: string
          target_id?: string
          details?: Json
          created_at?: string
          updated_at?: string
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
          id: string
          code: string
          name: string
          description: string
          is_active: boolean
          is_default: boolean
          requires_gateway: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description: string
          is_active: boolean
          is_default?: boolean
          requires_gateway?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string
          is_active?: boolean
          is_default?: boolean
          requires_gateway?: boolean
          created_at?: string
          updated_at?: string
        }
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
