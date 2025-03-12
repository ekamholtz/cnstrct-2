
import type { Invoice } from "@/types/invoice-types";
import { QBOInvoice, QBOPayment } from "./types";

export class InvoiceMapper {
  /**
   * Map an invoice to a QBO invoice
   */
  mapInvoiceToInvoice(invoice: Invoice, customerQBOId: string, incomeAccountId: string): QBOInvoice {
    // Ensure amount is a number
    const amount = typeof invoice.amount === 'number' 
      ? invoice.amount 
      : parseFloat(String(invoice.amount));

    // Format date as YYYY-MM-DD
    const txnDate = invoice.invoice_date || new Date().toISOString().split('T')[0];
    const dueDate = invoice.due_date || '';

    // Create the invoice
    const qboInvoice: QBOInvoice = {
      CustomerRef: {
        value: customerQBOId
      },
      Line: [
        {
          DetailType: "SalesItemLineDetail",
          Amount: amount,
          Description: invoice.description || `Invoice ${invoice.invoice_number}`,
          SalesItemLineDetail: {
            ItemRef: {
              value: incomeAccountId
            }
          }
        }
      ],
      TxnDate: txnDate,
      PrivateNote: invoice.notes || `Invoice from CNSTRCT - ID: ${invoice.id}`
    };

    // Add additional fields if available
    if (dueDate) {
      qboInvoice.DueDate = dueDate;
    }

    if (invoice.invoice_number) {
      qboInvoice.DocNumber = invoice.invoice_number;
    }

    return qboInvoice;
  }

  /**
   * Map a payment to a QBO payment
   */
  mapInvoicePaymentToPayment(
    payment: any, 
    customerQBOId: string, 
    invoiceQBOId: string, 
    paymentMethod?: string
  ): QBOPayment {
    // Ensure amount is a number
    const amount = typeof payment.amount === 'number' 
      ? payment.amount 
      : parseFloat(String(payment.amount));

    // Format payment date as YYYY-MM-DD
    const txnDate = payment.payment_date || new Date().toISOString().split('T')[0];

    // Map payment method to QBO payment type
    const paymentTypeMap: Record<string, string> = {
      cc: "CreditCard",
      check: "Check",
      transfer: "EFT",
      cash: "Cash"
    };

    // Create the payment
    const qboPayment: QBOPayment = {
      CustomerRef: {
        value: customerQBOId
      },
      TotalAmt: amount,
      TxnDate: txnDate,
      Line: [
        {
          Amount: amount,
          LinkedTxn: [
            {
              TxnId: invoiceQBOId,
              TxnType: "Invoice"
            }
          ]
        }
      ],
      PrivateNote: payment.notes || `Payment from CNSTRCT - ID: ${payment.id}`
    };

    // Add payment reference number if available
    if (payment.payment_reference) {
      qboPayment.PaymentRefNum = payment.payment_reference;
    }

    // Add payment type if available
    if (paymentMethod && paymentTypeMap[paymentMethod]) {
      qboPayment.PaymentType = paymentTypeMap[paymentMethod];
    }

    return qboPayment;
  }
}
