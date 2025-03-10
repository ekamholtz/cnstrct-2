export interface Invoice {
  id: string;
  client_id: string;
  project_id: string;
  invoice_number?: string;
  description?: string;
  amount: number;
  invoice_date?: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  notes?: string;
  created_at: string;
  updated_at: string;
}
