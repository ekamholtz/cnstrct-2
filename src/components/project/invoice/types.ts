
export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: "pending_payment" | "paid" | "cancelled";
  created_at: string;
  milestone_id: string;
  milestone_name: string;
  project_name: string;
  project_id: string;
  payment_method?: "cc" | "check" | "transfer" | "cash" | null;
  payment_date?: string | null;
  payment_reference?: string | null;
  payment_gateway?: string | null;
  payment_method_type?: "cc" | "check" | "transfer" | "cash" | "simulated" | null;
  simulation_data?: any;
  updated_at: string;
}

export interface PaymentFormData {
  payment_method: "cc" | "check" | "transfer" | "cash";
  payment_date: Date;
}

export interface PaymentModalProps {
  invoice: Invoice;
  onSubmit: (data: PaymentFormData) => void;
}

export interface InvoiceTableProps {
  invoices: Invoice[];
  onMarkAsPaid: (invoiceId: string, data: PaymentFormData) => void;
}
