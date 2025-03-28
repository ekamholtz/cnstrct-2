
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '../../hooks/useAuth';
import StripePaymentLinkService, { InvoiceData, PaymentLinkResponse } from '../../integrations/stripe/services/stripePaymentLinkService';
import { Loader2, Copy, ExternalLink } from "lucide-react";

interface CreatePaymentLinkProps {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  description: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
  }>;
  dueDate?: string;
  onLinkCreated?: (paymentLink: PaymentLinkResponse) => void;
}

const CreatePaymentLink: React.FC<CreatePaymentLinkProps> = ({
  invoiceId,
  invoiceNumber,
  customerName,
  customerEmail,
  amount,
  description,
  lineItems,
  dueDate,
  onLinkCreated
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);
  
  const paymentLinkService = new StripePaymentLinkService();
  
  const handleCreatePaymentLink = async () => {
    if (!user?.id) {
      setError('You must be logged in to create a payment link');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Format invoice data for the payment link service
      const invoiceData: InvoiceData = {
        id: invoiceId,
        number: invoiceNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        amount,
        description,
        due_date: dueDate,
        line_items: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_amount: item.unitAmount
        }))
      };
      
      // Create the payment link
      const response = await paymentLinkService.createPaymentLink(user.id, invoiceData);
      
      setPaymentLink(response);
      
      // Notify parent component if callback is provided
      if (onLinkCreated) {
        onLinkCreated(response);
      }
    } catch (err: any) {
      console.error('Error creating payment link:', err);
      setError(err.message || 'Failed to create payment link');
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    if (paymentLink?.url) {
      navigator.clipboard.writeText(paymentLink.url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err);
        });
    }
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {paymentLink ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment Link Created</CardTitle>
            <CardDescription>Send this link to your customer to collect payment for invoice #{invoiceNumber}.</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input 
                value={paymentLink.url} 
                readOnly
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? "Copied!" : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div>
              {copied && (
                <span className="text-xs text-muted-foreground transition-opacity duration-300">
                  Copied to clipboard!
                </span>
              )}
            </div>
            <Button asChild variant="default">
              <a href={paymentLink.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                View Payment Page <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Create Payment Link for Invoice #{invoiceNumber}</CardTitle>
            <CardDescription>Generate a payment link to send to your customer</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Customer: {customerName}</p>
                {customerEmail && (
                  <p className="text-sm text-muted-foreground">Email: {customerEmail}</p>
                )}
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium">Amount: ${amount.toFixed(2)}</p>
                {dueDate && (
                  <p className="text-sm text-muted-foreground">
                    Due Date: {new Date(dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={handleCreatePaymentLink} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Payment Link'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default CreatePaymentLink;
