
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PaymentLinkDisplayProps {
  invoiceId: string;
  refreshTrigger?: number; // Optional prop to trigger a refresh
}

interface PaymentLink {
  id: string;
  invoice_id: string;
  payment_link_id: string;
  payment_link_url: string;
  payment_intent_id?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  created_at: string;
  updated_at: string;
}

const PaymentLinkDisplay: React.FC<PaymentLinkDisplayProps> = ({ 
  invoiceId,
  refreshTrigger = 0
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const fetchPaymentLink = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('payment_links')
          .select('*')
          .eq('invoice_id', invoiceId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No payment link found
            setPaymentLink(null);
          } else {
            throw error;
          }
        } else {
          setPaymentLink(data as PaymentLink);
        }
      } catch (err: any) {
        console.error('Error fetching payment link:', err);
        setError(err.message || 'Failed to fetch payment link');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentLink();
  }, [invoiceId, refreshTrigger]);
  
  const copyToClipboard = () => {
    if (paymentLink?.payment_link_url) {
      navigator.clipboard.writeText(paymentLink.payment_link_url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err);
        });
    }
  };
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return "success";
      case 'pending':
        return "warning";
      case 'failed':
        return "destructive";
      case 'expired':
        return "outline";
      default:
        return "secondary";
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-2">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!paymentLink) {
    return (
      <div className="p-2">
        <p className="text-sm text-muted-foreground">
          No payment link has been created for this invoice yet.
        </p>
      </div>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">
          Payment Link
        </CardTitle>
        <Badge 
          variant={getStatusVariant(paymentLink.status) as "default" | "secondary" | "destructive" | "outline"}
        >
          {paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1)}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            value={paymentLink.payment_link_url}
            readOnly
            className="flex-1"
          />
          <Button 
            variant="outline" 
            onClick={copyToClipboard}
            size="sm"
            className="flex items-center"
          >
            <Copy className="h-4 w-4 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Created: {new Date(paymentLink.created_at).toLocaleString()}
          </span>
          
          <Button
            variant="link"
            size="sm"
            asChild
            className="p-0 h-auto"
          >
            <a 
              href={paymentLink.payment_link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary"
            >
              Open link <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
        
        {paymentLink.status === 'paid' && (
          <Alert variant="success" className="mt-2 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Payment has been completed for this invoice.
            </AlertDescription>
          </Alert>
        )}
        
        {paymentLink.status === 'failed' && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>
              Payment failed. You may need to create a new payment link.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentLinkDisplay;
