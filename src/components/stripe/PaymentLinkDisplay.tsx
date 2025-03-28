
import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, ExternalLink } from "lucide-react";
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!paymentLink) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No payment link has been created for this invoice yet.
      </div>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Payment Link</CardTitle>
        <Badge variant={getStatusColor(paymentLink.status) as any}>
          {paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1)}
        </Badge>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            value={paymentLink.payment_link_url}
            readOnly
            className="flex-1 text-sm"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={copyToClipboard}
            className="flex-shrink-0"
          >
            {copied ? "Copied!" : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Created: {new Date(paymentLink.created_at).toLocaleString()}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <div>
          {copied && (
            <span className="text-xs text-green-600 transition-opacity duration-300">
              Copied to clipboard!
            </span>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          asChild
        >
          <a 
            href={paymentLink.payment_link_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
          >
            Open link <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
      
      {paymentLink.status === 'paid' && (
        <div className="px-6 pb-4">
          <Alert variant="success" className="bg-green-50 border-green-200">
            <AlertDescription>
              Payment has been completed for this invoice.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {paymentLink.status === 'failed' && (
        <div className="px-6 pb-4">
          <Alert variant="destructive">
            <AlertDescription>
              Payment failed. You may need to create a new payment link.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
};

export default PaymentLinkDisplay;
