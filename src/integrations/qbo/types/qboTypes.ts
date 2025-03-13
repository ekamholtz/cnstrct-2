
/**
 * Common types for QBO integration
 */

// Response type for QBO API calls
export interface QBOApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Vendor data structure
export interface QBOVendorData {
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
}

// Bill data structure
export interface QBOBillData {
  VendorRef: {
    value: string;
  };
  Line: any[];
  DocNumber?: string;
  TxnDate?: string;
}

// Payment data structure
export interface QBOPaymentData {
  CustomerRef?: {
    value: string;
  };
  TotalAmt?: number;
  amount?: number;
  TxnDate?: string;
}

// Bill payment data structure
export interface QBOBillPaymentData {
  VendorRef: {
    value: string;
  };
  TotalAmt?: number;
  amount?: number;
  PayType?: string;
  CheckPayment?: {
    BankAccountRef: {
      value: string;
    }
  };
  Line?: any[];
  TxnDate?: string;
}

// Customer data structure
export interface QBOCustomerData {
  DisplayName: string;
  FullyQualifiedName?: string;
  CompanyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
}

// Invoice data structure
export interface QBOInvoiceData {
  CustomerRef: {
    value: string;
  };
  Line: any[];
  DocNumber?: string;
  TxnDate?: string;
}
