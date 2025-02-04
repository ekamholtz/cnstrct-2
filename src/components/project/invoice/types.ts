export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: "pending_payment" | "paid" | "cancelled";
  created_at: string;
  milestone: {
    name: string;
    project_id: string;
    project: {
      name: string;
    };
  };
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