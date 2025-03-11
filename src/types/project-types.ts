export interface Milestone {
  id: string;
  name: string;
  amount: number | null;
  status: MilestoneStatus | null;
  description?: string | null;
  project_id: string;
  gc_account_id?: string;
  created_at: string;
  updated_at: string;
}

export type MilestoneStatus = 'pending' | 'completed';

export interface ClientProject {
  id: string;
  name: string;
  address: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | string;
  client_id?: string;
  contractor_id?: string;
  gc_account_id?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
  milestones: Milestone[];
  expenses?: any[];
  owner_user_id?: string;
  pm_user_id?: string;
  total_contract_value?: number;
  created_at?: string;
}

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// Simplified milestone type with required properties for display in lists
export interface SimplifiedMilestone {
  id: string;
  name: string;
  amount: number | null;
  status: MilestoneStatus | null;
  project_id: string;
  created_at: string;
  updated_at: string;
}

// Add types for invoice status
export type InvoiceStatus = 'pending_payment' | 'paid' | 'cancelled';

// Add types for expense status
export type ExpensePaymentStatus = 'due' | 'paid' | 'partially_paid';

// Add types for user roles
export type UserRole = 'homeowner' | 'contractor' | 'project_manager' | 'gc_admin' | 'platform_admin';

// Add types for payment direction
export type PaymentDirection = 'incoming' | 'outgoing';

// Add types for payment status
export type PaymentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
