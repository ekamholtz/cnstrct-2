
import { DateRange } from "react-day-picker";

export type PaymentDirection = 'incoming' | 'outgoing';
export type PaymentMethodCode = 'cc' | 'check' | 'transfer' | 'cash';
export type PaymentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface PaymentMethod {
  id: string;
  name: string;
  code: PaymentMethodCode;
  is_active: boolean;
  requires_processor: boolean;
  processor_config?: Record<string, any>;
}

export interface Payment {
  id: string;
  direction: PaymentDirection;
  amount: number;
  payment_method_code: PaymentMethodCode;
  status: PaymentProcessingStatus;
  invoice_id?: string;
  expense_id?: string;
  payment_processor_id?: string;
  processor_transaction_id?: string;
  processor_metadata?: Record<string, any>;
  simulation_mode: boolean;
  simulation_data?: Record<string, any>;
  notes?: string;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  payment_id: string;
  event_type: string;
  event_data?: Record<string, any>;
  created_at: string;
  created_by: string;
}

export interface PaymentFilters {
  dateRange: DateRange;
  direction?: PaymentDirection;
  status?: PaymentProcessingStatus;
  paymentMethodCode?: PaymentMethodCode;
  projectId?: string;
}

export interface CreatePaymentData {
  amount: number;
  payment_method_code: PaymentMethodCode;
  payment_date: string;
  notes?: string;
  invoice_id?: string;
  expense_id?: string;
}
