export interface Invoice {
  id: string;
  client_id: string;
  project_id: string;
  project_name?: string;
  invoice_number?: string;
  description?: string;
  amount: number;
  invoice_date?: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void' | 'pending_payment' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  milestone_id?: string;
  milestone_name?: string;
  payment_method?: "cc" | "check" | "transfer" | "cash" | null;
  payment_date?: string | null;
  payment_reference?: string | null;
  payment_gateway?: string | null;
  payment_method_type?: "cc" | "check" | "transfer" | "cash" | "simulated" | null;
  simulation_data?: any;
  milestones?: { name: string };
  projects?: { name: string };
}
