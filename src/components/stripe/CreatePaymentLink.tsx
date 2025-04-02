
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface InvoiceData {
  id: string;
  number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  description: string;
  due_date?: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_amount: number;
  }>;
}

export interface PaymentLinkResponse {
  id: string;
  url: string;
  status: string;
}

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

// Mock service for now, to be replaced with actual implementation
class StripePaymentLinkService {
  async createPaymentLink(userId: string, invoiceData: InvoiceData): Promise<PaymentLinkResponse> {
    // Mock response for now
    return {
      id: 'pl_' + Math.random().toString(36).substring(2, 15),
      url: `https://checkout.stripe.com/pay/cs_test_${Math.random().toString(36).substring(2, 15)}`,
      status: 'pending'
    };
  }
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
          // Show temporary success message
          const messageCopy = document.getElementById('copy-message');
          if (messageCopy) {
            messageCopy.style.opacity = '1';
            setTimeout(() => {
              messageCopy.style.opacity = '0';
            }, 2000);
          }
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err);
        });
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {paymentLink ? (
        <Card className="p-6 mb-3">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Payment Link Created
            </h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={paymentLink.url}
                readOnly
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={copyToClipboard}
                size="sm"
              >
                Copy
              </Button>
            </div>
            
            <p 
              id="copy-message" 
              className="text-xs text-green-600 opacity-0 transition-opacity duration-300"
            >
              Copied to clipboard!
            </p>
            
            <p className="text-sm text-gray-600 mt-2">
              Send this link to your customer to collect payment for invoice #{invoiceNumber}.
            </p>
            
            <Button 
              variant="default" 
              asChild
              className="mt-2"
            >
              <a href={paymentLink.url} target="_blank" rel="noopener noreferrer">
                View Payment Page
              </a>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-medium">
              Create Payment Link for Invoice #{invoiceNumber}
            </h3>
            
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <strong>Customer:</strong> {customerName}
              </p>
              {customerEmail && (
                <p className="text-sm">
                  <strong>Email:</strong> {customerEmail}
                </p>
              )}
            </div>
          </div>
          
          <div className="md:text-right">
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <strong>Amount:</strong> ${amount.toFixed(2)}
              </p>
              {dueDate && (
                <p className="text-sm">
                  <strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <Button
              variant="default"
              onClick={handleCreatePaymentLink}
              disabled={loading}
              className="mt-2"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePaymentLink;
