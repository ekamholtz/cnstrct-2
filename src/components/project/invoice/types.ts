
export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: "pending_payment" | "paid" | "cancelled";
  created_at: string;
  project_id: string;
  milestone: {
    name: string;
    project: {
      name: string;
    };
  } | null;
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
