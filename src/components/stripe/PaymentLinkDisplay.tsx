import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Chip, 
  CircularProgress, 
  Paper, 
  TextField, 
  Typography, 
  Alert,
  Link
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
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
        return 'error';
      case 'expired':
        return 'default';
      default:
        return 'default';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!paymentLink) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No payment link has been created for this invoice yet.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Payment Link
        </Typography>
        <Chip 
          label={paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1)} 
          color={getStatusColor(paymentLink.status) as any}
          size="small"
        />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          value={paymentLink.payment_link_url}
          InputProps={{ readOnly: true }}
          size="small"
          sx={{ mr: 1 }}
        />
        <Button 
          variant="outlined" 
          onClick={copyToClipboard}
          size="small"
          startIcon={<ContentCopyIcon />}
          color={copied ? "success" : "primary"}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Created: {new Date(paymentLink.created_at).toLocaleString()}
        </Typography>
        
        <Link
          href={paymentLink.payment_link_url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <Button 
            variant="text" 
            size="small"
            endIcon={<OpenInNewIcon fontSize="small" />}
          >
            Open link
          </Button>
        </Link>
      </Box>
      
      {paymentLink.status === 'paid' && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success">
            Payment has been completed for this invoice.
          </Alert>
        </Box>
      )}
      
      {paymentLink.status === 'failed' && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error">
            Payment failed. You may need to create a new payment link.
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default PaymentLinkDisplay;
