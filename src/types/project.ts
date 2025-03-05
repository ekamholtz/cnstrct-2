
export interface Project {
  id: string;
  name: string;
  address: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  gc_account_id: string;
  pm_user_id: string; // This now represents the assigned user/PM
  client_id?: string;
  contractor_id?: string; // Now optional as we phase it out
}
