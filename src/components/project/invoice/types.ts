export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: "pending_payment" | "paid" | "cancelled";
  created_at: string;
  milestone: {
    name: string;
    project: {
      name: string;
    };
  };
}