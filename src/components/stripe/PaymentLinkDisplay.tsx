
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Copy, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentLinkDisplayProps {
  paymentLink: {
    id: string;
    url: string;
    status: string;
    created_at: string;
    expires_at?: string;
  };
  onClose?: () => void;
}

export function PaymentLinkDisplay({ paymentLink, onClose }: PaymentLinkDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink.url);
    setCopied(true);
    
    toast({
      title: "Link copied to clipboard",
      description: "You can now share this payment link with your client",
      // Make sure to use a valid variant
      variant: "default",
      duration: 3000,
    });
    
    setTimeout(() => setCopied(false), 3000);
  };

  const openLink = () => {
    window.open(paymentLink.url, '_blank');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    switch (paymentLink.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge className="bg-amber-100 text-amber-800">Expired</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{paymentLink.status}</Badge>;
    }
  };

  return (
    <Card className="w-full border-green-200 shadow-md">
      <CardHeader className="bg-green-50 border-b border-green-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-green-800">Payment Link Created</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Share this payment link with your client to collect payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="payment-link">Payment Link</Label>
          <div className="flex gap-2">
            <Input 
              id="payment-link" 
              value={paymentLink.url} 
              readOnly 
              className="flex-grow font-medium"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={copyToClipboard}
              className={copied ? "bg-green-50 text-green-600 border-green-200" : ""}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={openLink}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(paymentLink.created_at)}</p>
          </div>
          {paymentLink.expires_at && (
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="font-medium">{formatDate(paymentLink.expires_at)}</p>
            </div>
          )}
        </div>
        
        <div className="pt-4 flex justify-end">
          {onClose && (
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
