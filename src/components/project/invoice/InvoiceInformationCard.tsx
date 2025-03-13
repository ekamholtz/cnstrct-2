import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Invoice } from "./types";
import { PaymentModal } from "./PaymentModal";
import { PaymentSimulationModal } from "./PaymentSimulationModal";
import { Button } from "@/components/ui/button";
import { ArrowUpFromLine, CheckCircle2, Loader2 } from "lucide-react";
import { useSyncInvoiceToQBO } from "@/hooks/useSyncInvoiceToQBO";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { useQBOSyncStatus } from "@/hooks/useQBOSyncStatus";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InvoiceInformationCardProps {
  invoice: Invoice;
  isClient: boolean;
}

export function InvoiceInformationCard({ invoice, isClient }: InvoiceInformationCardProps) {
  const { syncInvoiceToQBO, isLoading } = useSyncInvoiceToQBO();
  const { connection } = useQBOConnection();
  const { isSynced, qboId, isLoading: isSyncStatusLoading } = useQBOSyncStatus('invoice', invoice.id);
  
  // Direct proxy implementation to bypass any potential service issues
  const handleSyncToQBO = async () => {
    console.log("Starting direct sync to QBO for invoice:", invoice.id);
    
    try {
      // Instead of going through multiple service layers, directly use our implemented hook
      const result = await syncInvoiceToQBO(invoice.id);
      console.log("Sync result:", result);
    } catch (error) {
      console.error("Error in handleSyncToQBO:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Invoice Information</CardTitle>
        <div className="flex space-x-2">
          {/* QuickBooks Sync Button - Only show if QBO is connected and user is not a client */}
          {connection && !isClient && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={isSynced ? "outline" : "outline"} 
                    size="sm" 
                    onClick={handleSyncToQBO} 
                    disabled={isLoading || isSyncStatusLoading}
                    className={`flex items-center ${isSynced ? 'border-green-500 text-green-500 hover:bg-green-50' : ''}`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : isSynced ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <ArrowUpFromLine className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? "Syncing..." : isSynced ? "Synced to QuickBooks" : "Sync to QuickBooks"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSynced 
                    ? `Already synced to QuickBooks with ID: ${qboId}` 
                    : "Send this invoice to QuickBooks Online"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {invoice.status === 'pending_payment' && (
            <div>
              {isClient ? (
                <PaymentSimulationModal
                  invoice={invoice}
                  onPaymentComplete={() => {
                    window.location.reload();
                  }}
                />
              ) : (
                <PaymentModal
                  invoice={invoice}
                  onSubmit={async (data) => {
                    console.log('Payment marked:', data);
                    window.location.reload();
                  }}
                />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Invoice #</span>
          <span>{invoice.invoice_number || "Not assigned"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span>{invoice.created_at ? format(new Date(invoice.created_at), 'MMM d, yyyy') : "Not set"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Project</span>
          <span>{invoice.project_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Milestone</span>
          <span>{invoice.milestone_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">${invoice.amount.toFixed(2)}</span>
        </div>
        {invoice.payment_date && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid On</span>
            <span>{format(new Date(invoice.payment_date), 'MMM d, yyyy')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
