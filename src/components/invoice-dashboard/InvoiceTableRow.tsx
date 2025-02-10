
import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { FileText, DollarSign } from "lucide-react";
import { PaymentModal } from "@/components/project/invoice/PaymentModal";
import { PaymentSimulationModal } from "@/components/project/invoice/PaymentSimulationModal";
import { StatusBadge } from "@/components/project/invoice/StatusBadge";
import { PaymentFormData, Invoice } from "@/components/project/invoice/types";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceTableRowProps {
  invoice: Invoice;
  onMarkAsPaid: (invoiceId: string, data: PaymentFormData) => Promise<void>;
}

export const InvoiceTableRow = ({ invoice, onMarkAsPaid }: InvoiceTableRowProps) => {
  // Fetch user profile to determine role
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      console.log('User profile data:', data); // Debug log
      return data;
    },
  });

  // Wait for role to be determined
  if (isLoading) return null;

  const isClient = profile?.role === 'homeowner';
  console.log('Role check - profile:', profile, 'isClient:', isClient);

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link to={`/invoices/${invoice.id}`} className="flex items-center hover:text-blue-600 transition-colors">
          <FileText className="h-4 w-4 mr-2 text-gray-500" />
          {invoice.invoice_number}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{invoice.project_name}</span>
          <span className="text-sm text-gray-500">{invoice.milestone_name}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
          {invoice.amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={invoice.status} />
      </TableCell>
      <TableCell>
        {format(new Date(invoice.created_at), 'MMM d, yyyy')}
      </TableCell>
      <TableCell>
        {isClient ? (
          invoice.status === 'pending_payment' && (
            <PaymentSimulationModal
              invoice={invoice}
              onPaymentComplete={() => {
                // Refetch invoices
                window.location.reload();
              }}
            />
          )
        ) : (
          <PaymentModal
            invoice={invoice}
            onSubmit={(data) => onMarkAsPaid(invoice.id, data)}
          />
        )}
      </TableCell>
    </TableRow>
  );
};
