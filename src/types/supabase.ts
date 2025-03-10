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
      profiles: {
        Row: {
          id: string
          full_name: string
          phone_number: string | null
          role: string
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
          phone_number?: string | null
          role: string
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
          phone_number?: string | null
          role?: string
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
      gc_accounts: {
        Row: {
          id: string
          name: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
          updated_at?: string | null
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
  }
}
