
import { useCallback } from 'react';
import type { QBOCustomer, QBOVendor, QBOBill, QBOInvoice, QBOPayment, QBOBillPayment, SelectOption } from '../mapping/types';

/**
 * Hook for mapping between CNSTRCT entities and QuickBooks Online entities
 */
export const useQBOMapper = () => {
  /**
   * Map a client to a QBO customer
   */
  const mapClientToCustomer = useCallback((client: {
    name: string;
    email?: string;
    address?: string;
  }): QBOCustomer => {
    return {
      DisplayName: client.name,
      ...(client.email ? {
        PrimaryEmailAddr: { Address: client.email }
      } : {}),
      ...(client.address ? {
        BillAddr: { Line1: client.address }
      } : {})
    };
  }, []);

  /**
   * Map a vendor to a QBO vendor
   */
  const mapVendorToQBOVendor = useCallback((vendor: {
    name: string;
    email?: string;
    address?: string;
  }): QBOVendor => {
    return {
      DisplayName: vendor.name,
      ...(vendor.email ? {
        PrimaryEmailAddr: { Address: vendor.email }
      } : {}),
      ...(vendor.address ? {
        BillAddr: { Line1: vendor.address }
      } : {})
    };
  }, []);

  /**
   * Map an invoice payment to a QBO payment
   */
  const mapInvoicePaymentToPayment = useCallback(({
    invoiceId,
    amount,
    date,
    paymentMethod
  }: {
    invoiceId: string;
    amount: number;
    date: Date;
    paymentMethod: string;
  }): QBOPayment => {
    return {
      TotalAmt: amount,
      TxnDate: date.toISOString().split('T')[0],
      PaymentType: paymentMethod,
      Line: [
        {
          Amount: amount,
          LinkedTxn: [
            {
              TxnId: invoiceId,
              TxnType: "Invoice"
            }
          ]
        }
      ],
      CustomerRef: {
        value: "" // This will be set by the service
      }
    };
  }, []);

  /**
   * Map an expense payment to a QBO bill payment
   */
  const mapExpensePaymentToBillPayment = useCallback(({
    billId,
    amount,
    date,
    paymentMethod
  }: {
    billId: string;
    amount: number;
    date: Date;
    paymentMethod: string;
  }): QBOBillPayment => {
    return {
      TotalAmt: amount,
      TxnDate: date.toISOString().split('T')[0],
      PayType: paymentMethod,
      Line: [
        {
          Amount: amount,
          LinkedTxn: [
            {
              TxnId: billId,
              TxnType: "Bill"
            }
          ]
        }
      ],
      VendorRef: {
        value: "" // This will be set by the service
      }
    };
  }, []);

  /**
   * Map QBO accounts to select options
   */
  const mapAccountsToSelectOptions = useCallback((accounts: any[]): SelectOption[] => {
    if (!Array.isArray(accounts)) {
      console.error('Expected accounts to be an array but got:', typeof accounts);
      return [];
    }

    return accounts.map(account => ({
      label: account.Name,
      value: account.Id,
      type: account.AccountType,
      subType: account.AccountSubType
    }));
  }, []);

  return {
    mapClientToCustomer,
    mapVendorToQBOVendor,
    mapInvoicePaymentToPayment,
    mapExpensePaymentToBillPayment,
    mapAccountsToSelectOptions
  };
};
