
import { DateRange } from "react-day-picker";

export type PaymentType = "cc" | "check" | "transfer" | "cash";

export interface PaymentFilters {
  dateRange: DateRange;
  paymentType?: PaymentType;
  projectId?: string;
}

export interface ExpenseDetail {
  id: string;
  name: string;
  amount: number;
  payment_status: string;
  project: {
    id: string;
    name: string;
  };
}

export interface Payment {
  id: string;
  expense_id: string;
  payment_type: PaymentType;
  payment_date: string;
  payment_amount: number;
  vendor_email?: string;
  vendor_phone?: string;
  created_at: string;
  updated_at: string;
  expense: ExpenseDetail;
}
