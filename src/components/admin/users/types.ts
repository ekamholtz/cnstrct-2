
export type UserRole = 'client' | 'contractor' | 'employee' | 'homeowner' | 'gc_admin' | 'platform_admin' | 'project_manager';

export type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  account_status: string;
};
