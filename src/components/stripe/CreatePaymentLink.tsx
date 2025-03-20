import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress, 
  TextField, 
  Typography, 
  Alert,
  Paper,
  Grid
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import StripePaymentLinkService, { InvoiceData, PaymentLinkResponse } from '../../integrations/stripe/services/stripePaymentLinkService';

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
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {paymentLink ? (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Link Created
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              value={paymentLink.url}
              InputProps={{ readOnly: true }}
              size="small"
              sx={{ mr: 1 }}
            />
            <Button 
              variant="outlined" 
              onClick={copyToClipboard}
              size="small"
            >
              Copy
            </Button>
          </Box>
          
          <Typography 
            id="copy-message" 
            variant="caption" 
            sx={{ 
              opacity: 0, 
              transition: 'opacity 0.3s',
              color: 'success.main' 
            }}
          >
            Copied to clipboard!
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Send this link to your customer to collect payment for invoice #{invoiceNumber}.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            href={paymentLink.url} 
            target="_blank" 
            sx={{ mt: 2 }}
          >
            View Payment Page
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Typography variant="h6">
              Create Payment Link for Invoice #{invoiceNumber}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Customer:</strong> {customerName}
            </Typography>
            {customerEmail && (
              <Typography variant="body2">
                <strong>Email:</strong> {customerEmail}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
            <Typography variant="body2">
              <strong>Amount:</strong> ${amount.toFixed(2)}
            </Typography>
            {dueDate && (
              <Typography variant="body2">
                <strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreatePaymentLink}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Payment Link'
              )}
            </Button>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CreatePaymentLink;
