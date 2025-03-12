
// Common types for QBO mapping services
import type { Client } from "@/types/client-types";
import type { ClientProject } from "@/types/project-types";
import type { Expense, Payment } from "@/components/project/expense/types";
import type { Invoice } from "@/types/invoice-types";

export interface QBOCustomer {
  Id?: string;
  DisplayName: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  BillAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  Notes?: string;
}

export interface QBOVendor {
  Id?: string;
  DisplayName: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  BillAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  Notes?: string;
}

export interface QBOBill {
  VendorRef: {
    value: string;
  };
  Line: Array<{
    DetailType: string;
    Amount: number;
    AccountBasedExpenseLineDetail?: {
      AccountRef: {
        value: string;
      };
      Description?: string;
      TaxCodeRef?: {
        value: string;
      };
    }
  }>;
  TxnDate: string;
  DueDate?: string;
  DocNumber?: string;
  PrivateNote?: string;
}

export interface QBOBillPayment {
  VendorRef: {
    value: string;
  };
  TotalAmt: number;
  PayType?: string;
  TxnDate: string;
  DocNumber?: string;
  PrivateNote?: string;
  Line: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
}

export interface QBOInvoice {
  CustomerRef: {
    value: string;
  };
  Line: Array<{
    DetailType: string;
    Amount: number;
    SalesItemLineDetail?: {
      ItemRef: {
        value: string;
      };
      TaxCodeRef?: {
        value: string;
      };
    };
    Description?: string;
  }>;
  TxnDate: string;
  DueDate?: string;
  DocNumber?: string;
  PrivateNote?: string;
}

export interface QBOPayment {
  CustomerRef: {
    value: string;
  };
  TotalAmt: number;
  TxnDate: string;
  PaymentRefNum?: string;
  PrivateNote?: string;
  PaymentType?: string;
  Line: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
}

export interface QBOAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType: string;
  AcctNum?: string;
}

export interface SelectOption {
  label: string;
  value: string;
  type?: string;
  subType?: string;
}
