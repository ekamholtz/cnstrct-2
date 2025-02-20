
import { DateRange } from "react-day-picker";

export type PaymentType = "cc" | "check" | "transfer" | "cash";

export interface PaymentFilters {
  dateRange: DateRange;
  paymentType?: PaymentType;
  projectId?: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
}

export interface ExpenseDetail {
  id: string;
  name: string;
  amount: number;
  payment_status: string;
  project_id: string;
  project: ProjectDetail;
}

export interface Payment {
  id: string;
  expense: ExpenseDetail;
  payment_type: PaymentType;
  payment_date: string;
  payment_amount: number;
  vendor_email?: string;
  vendor_phone?: string;
  created_at: string;
  updated_at: string;
}
