
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PaymentLinkButton } from '@/components/PaymentLinkButton';
import {
  Download,
  MoreHorizontal,
  SendHorizonal,
  Check,
  CreditCard
} from 'lucide-react';
import { Invoice } from '@/types/invoice-types';
import { useToast } from '@/components/ui/use-toast';

interface InvoiceActionsProps {
  invoice: Invoice;
  onMarkAsPaid?: () => void;
  onSend?: () => void;
}

export default function InvoiceActions({ invoice, onMarkAsPaid, onSend }: InvoiceActionsProps) {
  const { toast } = useToast();
  
  const handlePrintInvoice = () => {
    window.print();
  };
  
  const handlePaymentLinkSuccess = (url: string) => {
    toast({
      title: "Payment Link Created",
      description: "The payment link has been created and is ready to share."
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "The payment link has been copied to your clipboard."
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };
  
  return (
    <div className="flex gap-2">
      {invoice.status !== 'paid' && (
        <PaymentLinkButton
          invoiceId={invoice.id}
          amount={invoice.amount}
          description={`Invoice ${invoice.invoice_number || '#' + invoice.id.substring(0, 8)}`}
          projectId={invoice.project_id}
          onSuccess={handlePaymentLinkSuccess}
          variant="outline"
          size="sm"
        />
      )}
      
      <Button variant="outline" size="sm" onClick={onSend} disabled={!onSend}>
        <SendHorizonal className="mr-1.5 h-4 w-4" />
        Send
      </Button>
      
      <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
        <Download className="mr-1.5 h-4 w-4" />
        Download
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {invoice.status !== 'paid' && (
            <DropdownMenuItem onClick={onMarkAsPaid} disabled={!onMarkAsPaid}>
              <Check className="mr-2 h-4 w-4" />
              Mark as Paid
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => console.log("Invoice details", invoice)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Simulate Payment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
