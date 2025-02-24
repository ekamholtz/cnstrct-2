
export type UserRole = 'admin' | 'general_contractor' | 'homeowner';

export type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  account_status: string;
};
