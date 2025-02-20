
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "./types";

interface PaymentDetailsCardProps {
  invoice: Invoice;
}

export function PaymentDetailsCard({ invoice }: PaymentDetailsCardProps) {
  if (invoice.status !== "paid") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-500">Payment Method</h3>
            <p className="capitalize">{invoice.payment_method}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-500">Payment Date</h3>
            <p>{invoice.payment_date ? format(new Date(invoice.payment_date), 'MMM d, yyyy') : 'N/A'}</p>
          </div>
        </div>
        {invoice.payment_reference && (
          <div>
            <h3 className="font-medium text-gray-500">Payment Reference</h3>
            <p>{invoice.payment_reference}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
