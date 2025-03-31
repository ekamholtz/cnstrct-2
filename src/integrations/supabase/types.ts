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
      checkout_sessions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          gc_account_id: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_account_id: string
          stripe_session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          gc_account_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_account_id: string
          stripe_session_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          gc_account_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_account_id?: string
          stripe_session_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_gc_account_id_fkey"
            columns: ["gc_account_id"]
            isOneToOne: false
            referencedRelation: "gc_accounts"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string | null
          expense_date: string
          expense_number: string | null
          expense_type: Database["public"]["Enums"]["expense_type"] | null
          gc_account_id: string | null
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
          created_at?: string | null
          expense_date: string
          expense_number?: string | null
          expense_type?: Database["public"]["Enums"]["expense_type"] | null
          gc_account_id?: string | null
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
          created_at?: string | null
          expense_date?: string
          expense_number?: string | null
          expense_type?: Database["public"]["Enums"]["expense_type"] | null
          gc_account_id?: string | null
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
            foreignKeyName: "expenses_gc_account_id_fkey"
            columns: ["gc_account_id"]
            isOneToOne: false
            referencedRelation: "gc_accounts"
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
      gc_accounts: {
        Row: {
          address: string | null
          company_name: string
          created_at: string | null
          id: string
          license_number: string | null
          owner_id: string | null
          phone_number: string | null
          subscription_tier_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          created_at?: string | null
          id?: string
          license_number?: string | null
          owner_id?: string | null
          phone_number?: string | null
          subscription_tier_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          created_at?: string | null
          id?: string
          license_number?: string | null
          owner_id?: string | null
          phone_number?: string | null
          subscription_tier_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gc_accounts_subscription_tier_id_fkey"
            columns: ["subscription_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_expenses: {
        Row: {
          amount: number
          amount_due: number
          created_at: string
          expense_date: string
          expense_number: string
          expense_type: Database["public"]["Enums"]["homeowner_expense_type"]
          gc_account_id: string | null
          homeowner_id: string
          id: string
          name: string
          notes: string | null
          payee: string
          payment_status: Database["public"]["Enums"]["homeowner_payment_status"]
          project_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          amount_due: number
          created_at?: string
          expense_date: string
          expense_number: string
          expense_type?: Database["public"]["Enums"]["homeowner_expense_type"]
          gc_account_id?: string | null
          homeowner_id: string
          id?: string
          name: string
          notes?: string | null
          payee: string
          payment_status?: Database["public"]["Enums"]["homeowner_payment_status"]
          project_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_due?: number
          created_at?: string
          expense_date?: string
          expense_number?: string
          expense_type?: Database["public"]["Enums"]["homeowner_expense_type"]
          gc_account_id?: string | null
          homeowner_id?: string
          id?: string
          name?: string
          notes?: string | null
          payee?: string
          payment_status?: Database["public"]["Enums"]["homeowner_payment_status"]
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_expenses_gc_account_id_fkey"
            columns: ["gc_account_id"]
            isOneToOne: false
            referencedRelation: "gc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_expenses_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_expenses_project_id_fkey"
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
          created_at: string | null
          gc_account_id: string | null
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
          created_at?: string | null
          gc_account_id?: string | null
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
          created_at?: string | null
          gc_account_id?: string | null
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
            foreignKeyName: "invoices_gc_account_id_fkey"
            columns: ["gc_account_id"]
            isOneToOne: false
            referencedRelation: "gc_accounts"
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
          amount: number
          created_at: string | null
          description: string | null
          gc_account_id: string | null
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
          gc_account_id?: string | null
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
          gc_account_id?: string | null
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
      payment_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_data: Json | null
          event_type: string
          id: string
          payment_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          payment_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          payment_id?: string
        }
        Relationships: []
      }
      payment_links: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          customer_email: string | null
          customer_name: string | null
          description: string | null
          id: string
          payment_link_id: string
          platform_fee: number
          project_id: string | null
          status: string
          stripe_account_id: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          payment_link_id: string
          platform_fee: number
          project_id?: string | null
          status: string
          stripe_account_id: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          payment_link_id?: string
          platform_fee?: number
          project_id?: string | null
          status?: string
          stripe_account_id?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          checkout_session_id: string | null
          created_at: string | null
          currency: string
          customer_email: string | null
          customer_name: string | null
          description: string | null
          error_message: string | null
          id: string
          payment_intent_id: string
          platform_fee: number | null
          project_id: string | null
          status: string
          stripe_account_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          checkout_session_id?: string | null
          created_at?: string | null
          currency: string
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          payment_intent_id: string
          platform_fee?: number | null
          project_id?: string | null
          status: string
          stripe_account_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          checkout_session_id?: string | null
          created_at?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          payment_intent_id?: string
          platform_fee?: number | null
          project_id?: string | null
          status?: string
          stripe_account_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_checkout_session_id_fkey"
            columns: ["checkout_session_id"]
            isOneToOne: false
            referencedRelation: "checkout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          direction: Database["public"]["Enums"]["payment_direction"]
          expense_id: string | null
          gc_account_id: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method_code: string
          payment_processor_id: string | null
          payment_reference: string | null
          processor_metadata: Json | null
          processor_transaction_id: string | null
          simulation_data: Json | null
          simulation_mode: boolean | null
          status: Database["public"]["Enums"]["payment_processing_status"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          direction: Database["public"]["Enums"]["payment_direction"]
          expense_id?: string | null
          gc_account_id?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method_code: string
          payment_processor_id?: string | null
          payment_reference?: string | null
          processor_metadata?: Json | null
          processor_transaction_id?: string | null
          simulation_data?: Json | null
          simulation_mode?: boolean | null
          status?: Database["public"]["Enums"]["payment_processing_status"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          direction?: Database["public"]["Enums"]["payment_direction"]
          expense_id?: string | null
          gc_account_id?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method_code?: string
          payment_processor_id?: string | null
          payment_reference?: string | null
          processor_metadata?: Json | null
          processor_transaction_id?: string | null
          simulation_data?: Json | null
          simulation_mode?: boolean | null
          status?: Database["public"]["Enums"]["payment_processing_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_expense_id_fkey1"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_gc_account_id_fkey"
            columns: ["gc_account_id"]
            isOneToOne: false
            referencedRelation: "gc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_code_fkey"
            columns: ["payment_method_code"]
            isOneToOne: false
            referencedRelation: "supported_payment_methods"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          address: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          full_name: string
          gc_account_id: string | null
          has_completed_profile: boolean | null
          id: string
          license_number: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          subscription_tier_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_status?: string
          address?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name: string
          gc_account_id?: string | null
          has_completed_profile?: boolean | null
          id: string
          license_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_tier_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_status?: string
          address?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string
          gc_account_id?: string | null
          has_completed_profile?: boolean | null
          id?: string
          license_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_tier_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_subscription_tier_id_fkey"
            columns: ["subscription_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string
          file_size: number
          file_url: string
          filename: string
          id: string
          mime_type: string
          project_id: string
          share_with_client: boolean
          updated_at: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          file_size: number
          file_url: string
          filename: string
          id?: string
          mime_type: string
          project_id: string
          share_with_client?: boolean
          updated_at?: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          file_size?: number
          file_url?: string
          filename?: string
          id?: string
          mime_type?: string
          project_id?: string
          share_with_client?: boolean
          updated_at?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_uploader_id_fkey"
            columns: ["uploader_id"]
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
          created_at: string | null
          description: string | null
          gc_account_id: string | null
          id: string
          name: string
          pm_user_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          total_contract_value: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          gc_account_id?: string | null
          id?: string
          name: string
          pm_user_id?: string | null
          status: Database["public"]["Enums"]["project_status"]
          total_contract_value?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          gc_account_id?: string | null
          id?: string
          name?: string
          pm_user_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          total_contract_value?: number | null
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
      qbo_connections: {
        Row: {
          access_token: string
          company_id: string
          company_name: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          company_id: string
          company_name: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          company_id?: string
          company_name?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      qbo_references: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          local_entity_id: string
          local_entity_type: string
          qbo_company_id: string
          qbo_entity_id: string
          qbo_entity_type: string
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          local_entity_id: string
          local_entity_type: string
          qbo_company_id: string
          qbo_entity_id: string
          qbo_entity_type: string
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          local_entity_id?: string
          local_entity_type?: string
          qbo_company_id?: string
          qbo_entity_id?: string
          qbo_entity_type?: string
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      qbo_sync_logs: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          payload: Json | null
          qbo_reference_id: string | null
          response: Json | null
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          qbo_reference_id?: string | null
          response?: Json | null
          status: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          qbo_reference_id?: string | null
          response?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_sync_logs_qbo_reference_id_fkey"
            columns: ["qbo_reference_id"]
            isOneToOne: false
            referencedRelation: "qbo_references"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_connect_accounts: {
        Row: {
          access_token: string | null
          account_id: string
          charges_enabled: boolean | null
          created_at: string | null
          details: Json | null
          details_submitted: boolean | null
          gc_account_id: string | null
          id: string
          payouts_enabled: boolean | null
          refresh_token: string | null
          scope: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id: string
          charges_enabled?: boolean | null
          created_at?: string | null
          details?: Json | null
          details_submitted?: boolean | null
          gc_account_id?: string | null
          id?: string
          payouts_enabled?: boolean | null
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string
          charges_enabled?: boolean | null
          created_at?: string | null
          details?: Json | null
          details_submitted?: boolean | null
          gc_account_id?: string | null
          id?: string
          payouts_enabled?: boolean | null
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_connect_accounts_gc_account_id_fkey"
            columns: ["gc_account_id"]
            isOneToOne: true
            referencedRelation: "gc_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_connections: {
        Row: {
          access_token: string
          account_id: string
          created_at: string
          id: string
          publishable_key: string
          refresh_token: string | null
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          account_id: string
          created_at?: string
          id?: string
          publishable_key: string
          refresh_token?: string | null
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string
          created_at?: string
          id?: string
          publishable_key?: string
          refresh_token?: string | null
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          fee_percentage: number | null
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fee_percentage?: number | null
          id?: string
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fee_percentage?: number | null
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      supported_payment_methods: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          processor_config: Json | null
          requires_processor: boolean | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          processor_config?: Json | null
          requires_processor?: boolean | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          processor_config?: Json | null
          requires_processor?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tier_features: {
        Row: {
          created_at: string | null
          feature_key: string
          tier_id: string
          usage_limit: number | null
        }
        Insert: {
          created_at?: string | null
          feature_key: string
          tier_id: string
          usage_limit?: number | null
        }
        Update: {
          created_at?: string | null
          feature_key?: string
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
      can_access_invoice: {
        Args: {
          invoice_id: string
        }
        Returns: boolean
      }
      can_manage_profile: {
        Args: {
          profile_id: string
        }
        Returns: boolean
      }
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
      check_project_access: {
        Args: {
          project_id: string
        }
        Returns: boolean
      }
      check_same_gc_account: {
        Args: {
          target_profile_id: string
        }
        Returns: boolean
      }
      create_get_client_invoices_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      get_client_invoices: {
        Args: {
          project_ids: string
        }
        Returns: {
          id: string
          milestone_id: string
          project_id: string
          invoice_number: string
          amount: number
          status: string
          milestone_name: string
          project_name: string
          payment_method: string
          payment_date: string
          payment_reference: string
          payment_gateway: string
          simulation_data: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_user_gc_account: {
        Args: Record<PropertyKey, never>
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
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      has_feature_access: {
        Args: {
          feature_key: string
        }
        Returns: boolean
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
      insert_milestones: {
        Args: {
          milestones_data: Json
        }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_gc_account_owner:
        | {
            Args: {
              user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              user_id: string
              gc_account_id: string
            }
            Returns: boolean
          }
      is_gc_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_gc_admin_of: {
        Args: {
          profile_id: string
        }
        Returns: boolean
      }
      is_pm_for_project: {
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
      transfer_gc_ownership: {
        Args: {
          current_owner_id: string
          new_owner_id: string
          gc_account_id: string
        }
        Returns: boolean
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
      homeowner_expense_type: "labor" | "materials" | "subcontractor" | "other"
      homeowner_payment_status: "due" | "partially_paid" | "paid"
      invoice_status: "pending_payment" | "paid" | "cancelled"
      milestone_status: "pending" | "completed"
      payment_direction: "incoming" | "outgoing"
      payment_method: "cc" | "check" | "transfer" | "cash"
      payment_method_type: "cc" | "check" | "transfer" | "cash" | "simulated"
      payment_processing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      payment_status: "due" | "partially_paid" | "paid"
      project_status: "draft" | "active" | "completed" | "cancelled"
      subscription_status: "active" | "cancelled" | "past_due" | "trialing"
      user_role: "platform_admin" | "gc_admin" | "project_manager" | "homeowner"
      userrole: "gc_admin" | "subcontractor" | "client"
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
