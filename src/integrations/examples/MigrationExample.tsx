/**
 * Migration Example Component
 * 
 * This file demonstrates how to migrate from legacy implementations
 * to the new unified service architecture for both QBO and Stripe.
 * 
 * The component shows both the "old way" (commented out) and the
 * "new way" of handling API integrations.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import the new service classes
import { QboService } from '@/integrations/services/QboService';
import { StripeService } from '@/integrations/services/StripeService';

const MigrationExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize service instances
  const qboService = new QboService({
    clientId: process.env.QBO_CLIENT_ID || '',
    clientSecret: process.env.QBO_CLIENT_SECRET || ''
  });
  
  const stripeService = new StripeService({
    secretKey: process.env.STRIPE_SECRET_KEY || ''
  });
  
  /**
   * QBO Example - Get Company Info
   * 
   * This function demonstrates how to use the new QboService to get company information
   * instead of making direct API calls through the old CORS proxy.
   */
  const getQboCompanyInfo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // OLD WAY (commented out):
      /*
      // Manually create HTTP request to the old CORS proxy
      const response = await fetch('http://localhost:3000/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://quickbooks.api.intuit.com/v3/company/123456789/companyinfo/123456789',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch company info');
      }
      
      const data = await response.json();
      setResult(data);
      */
      
      // NEW WAY using QboService:
      // Get the access token and company ID from wherever you store them
      const accessToken = localStorage.getItem('qbo_access_token');
      const companyId = localStorage.getItem('qbo_company_id');
      
      if (!accessToken || !companyId) {
        throw new Error('Missing QBO credentials');
      }
      
      // Use the QboService to fetch company info
      const { success, data, error } = await qboService.getCompanyInfo(accessToken, companyId);
      
      if (success) {
        setResult(data);
      } else {
        throw new Error(error?.message || 'Failed to fetch company info');
      }
      
    } catch (err: any) {
      console.error('Error fetching QBO company info:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Stripe Example - Create Payment Intent
   * 
   * This function demonstrates how to use the new StripeService to create a payment intent
   * instead of making direct API calls.
   */
  const createStripePaymentIntent = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // OLD WAY (commented out):
      /*
      // Direct API call with hardcoded secret key
      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk_test_your_secret_key`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          amount: '1000',
          currency: 'usd'
        }).toString()
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }
      
      const data = await response.json();
      setResult(data);
      */
      
      // NEW WAY using StripeService:
      // Create a payment intent for $10.00
      const { success, data, error } = await stripeService.createPaymentIntent(1000, 'usd');
      
      if (success) {
        setResult(data);
      } else {
        throw new Error(error?.message || 'Failed to create payment intent');
      }
      
    } catch (err: any) {
      console.error('Error creating Stripe payment intent:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>API Integration Migration Example</CardTitle>
        <CardDescription>
          This example demonstrates how to use the new unified service architecture
          for QBO and Stripe integrations.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="qbo">
          <TabsList className="mb-4">
            <TabsTrigger value="qbo">QuickBooks Online</TabsTrigger>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
          </TabsList>
          
          <TabsContent value="qbo" className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <h3 className="text-sm font-medium mb-2">QBO Integration Benefits:</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Unified error handling and responses</li>
                <li>Simplified authentication flow</li>
                <li>Type safety with TypeScript interfaces</li>
                <li>Reusable service methods</li>
              </ul>
            </div>
            
            <Button 
              onClick={getQboCompanyInfo} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching QBO Data...
                </>
              ) : (
                'Get QBO Company Info'
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="stripe" className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <h3 className="text-sm font-medium mb-2">Stripe Integration Benefits:</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Secure API key handling through the proxy</li>
                <li>Consistent response format</li>
                <li>Simplified error management</li>
                <li>Centralized request processing</li>
              </ul>
            </div>
            
            <Button 
              onClick={createStripePaymentIntent} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Payment Intent...
                </>
              ) : (
                'Create Stripe Payment Intent'
              )}
            </Button>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Result:</h3>
            <pre className="p-4 bg-slate-100 rounded-md overflow-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4 text-xs text-muted-foreground">
        <span>Note: Configure your API keys in environment variables for production use</span>
      </CardFooter>
    </Card>
  );
};

export default MigrationExample;
