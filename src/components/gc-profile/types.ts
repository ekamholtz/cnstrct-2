
import { UserRole } from "@/components/admin/users/types";

export interface GCUserProfile {
  id: string;
  gc_account_id?: string | null;
  full_name: string;
  email: string; // Make sure email is included in the interface
  role: UserRole;
  company_name?: string | null;
  phone_number?: string | null;
  address?: string | null;
  license_number?: string | null;
  website?: string | null;
  bio?: string | null;
  has_completed_profile: boolean;
  account_status: string;
  created_at: string;
  updated_at: string;
  is_owner?: boolean; // Optional property to indicate if the user is the owner
}

export interface CreateGCUserFormData {
  full_name: string;
  email: string;
  role: UserRole;
  send_invite?: boolean;
}

// Add the missing CreateUserFormValues interface
export interface CreateUserFormValues {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  gc_account_id?: string;
}
