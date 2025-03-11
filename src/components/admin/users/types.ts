export type UserRole = 'client' | 'contractor' | 'employee' | 'homeowner' | 'gc_admin' | 'platform_admin';

export type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  account_status: string;
};
