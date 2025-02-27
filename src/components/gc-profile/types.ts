
import { UserRole } from "@/components/admin/users/types";

export interface GCUserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  role: UserRole;
  gc_account_id?: string;
  has_completed_profile?: boolean;
  created_at?: string;
}

export interface CreateUserFormValues {
  name: string;
  email: string;
  phone: string;
  role: "gc_admin" | "project_manager";
}
