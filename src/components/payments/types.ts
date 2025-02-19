
import { DateRange } from "react-day-picker";

export interface PaymentFilters {
  dateRange: DateRange;
  paymentType?: string;
  projectId?: string;
}

export interface Payment {
  id: string;
  payment_date: string;
  payment_amount: number;
  payment_type: string;
  vendor_email?: string;
  vendor_phone?: string;
  created_at: string;
  updated_at: string;
  expense: {
    id: string;
    name: string;
    project: {
      id: string;
      name: string;
    };
  };
}
