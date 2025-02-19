
export type UserRole = 'admin' | 'general_contractor' | 'homeowner' | 'project_manager';

export type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  account_status: string;
  invitation_status?: 'pending' | 'accepted' | 'expired';
  phone_number?: string;
  company_id?: string;
  invite_token?: string;
  invite_expires_at?: string;
  created_at: string;
};
