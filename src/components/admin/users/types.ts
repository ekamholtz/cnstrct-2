export type UserRole = 'platform_admin' | 'gc_admin' | 'project_manager' | 'homeowner' | 'contractor';

export type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  account_status: string;
};
