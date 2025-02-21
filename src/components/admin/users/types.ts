
export type UserRole = 'admin' | 'gc_admin' | 'project_manager' | 'homeowner';

export type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  account_status: string;
};
