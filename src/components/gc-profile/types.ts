import { UserRole } from "@/components/admin/users/types";

export interface GCUserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  gc_account_id: string;
  company_name?: string;
  license_number?: string;
  address?: string;
  website?: string;
  bio?: string;
  has_completed_profile: boolean;
  account_status?: string;
  created_at?: string;
  updated_at?: string;
  is_owner?: boolean;
}

export interface CreateUserFormValues {
  name: string;
  email: string;
  phone: string;
  role: "gc_admin" | "project_manager";
  gc_account_id?: string;
  is_owner?: boolean;
}
