
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { StripeService } from '@/integrations/stripe/services/StripeService';
import { Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PaymentLinkButtonProps {
  invoiceId: string;
  amount: number;
  description: string;
  projectId?: string;
  customerEmail?: string;
  customerName?: string;
  onSuccess?: (url: string) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PaymentLinkButton({
  invoiceId,
  amount,
  description,
  projectId,
  customerEmail,
  customerName,
  onSuccess,
  variant = 'default',
  size = 'default'
}: PaymentLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const stripeService = new StripeService();
  
  const handleCreatePaymentLink = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to create a payment link',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const metadata: Record<string, string> = {
        invoice_id: invoiceId,
      };
      
      if (projectId) {
        metadata.project_id = projectId;
      }
      
      const result = await stripeService.createPaymentLink(
        user.id,
        amount,
        description,
        metadata,
        customerEmail,
        customerName
      );
      
      if (!result.success || !result.data) {
        toast({
          title: 'Error creating payment link',
          description: result.error?.message || 'Something went wrong',
          variant: 'destructive',
        });
        return;
      }
      
      setPaymentUrl(result.data.url);
      
      if (onSuccess) {
        onSuccess(result.data.url);
      } else {
        toast({
          title: 'Payment link created',
          description: 'Your payment link has been created successfully',
        });
      }
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      toast({
        title: 'Error creating payment link',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (paymentUrl) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => window.open(paymentUrl, '_blank')}
        className="flex items-center gap-2"
      >
        <ExternalLink className="h-4 w-4" />
        Open Payment Link
      </Button>
    );
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCreatePaymentLink}
      disabled={loading}
      className="flex items-center gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Create Payment Link
    </Button>
  );
}
