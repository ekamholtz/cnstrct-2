
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { qboProxy } from '@/integrations/qbo/qboProxyService';
import { qboAuth } from '@/integrations/qbo/authService';
import { supabase } from '@/integrations/supabase/client';
import { QBOConnection } from '@/integrations/qbo/types';
import type { QBOConnectionMinimal } from '@/integrations/qbo/types';

export function QBOSettings() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connection, setConnection] = useState<QBOConnectionMinimal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gcAccountId, setGcAccountId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConnection = async () => {
      try {
        setLoading(true);
        
        // Get the user's GC account ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('gc_account_id')
          .eq('id', user.id)
          .single();
        
        if (!profile?.gc_account_id) {
          throw new Error('No GC account associated with this user');
        }
        
        setGcAccountId(profile.gc_account_id);
        
        // Check for existing QBO connection
        const conn = await qboProxy.getConnection();
        setConnection(conn ? {
          user_id: conn.user_id,
          realm_id: conn.realm_id,
          created_at: conn.created_at,
          expires_at: conn.expires_at
        } : null);
      } catch (err) {
        console.error('Error fetching QBO connection:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConnection();
  }, []);

  const handleConnectQBO = async () => {
    try {
      if (!gcAccountId) {
        throw new Error('No GC account ID found');
      }
      
      setConnecting(true);
      setError(null);
      
      // Initialize OAuth flow
      const authUrl = await qboAuth.authorize(gcAccountId);
      
      // Redirect to QuickBooks OAuth page
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error connecting to QBO:', err);
      setError(err.message);
      setConnecting(false);
    }
  };

  const handleDisconnectQBO = async () => {
    try {
      setDisconnecting(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Disconnect from QBO
      await qboAuth.disconnect(user.id);
      
      setConnection(null);
    } catch (err) {
      console.error('Error disconnecting from QBO:', err);
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Integration</CardTitle>
          <CardDescription>Connect your CNSTRCT account with QuickBooks Online</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-cnstrct-orange" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>QuickBooks Integration</CardTitle>
        <CardDescription>Connect your CNSTRCT account with QuickBooks Online</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {connection ? (
          <div className="space-y-4">
            <Alert>
              <Check className="h-4 w-4 text-green-500" />
              <AlertTitle>Connected to QuickBooks</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2 text-sm">
                  <p><span className="font-medium">Company ID:</span> {connection.realm_id}</p>
                  <p><span className="font-medium">Connected on:</span> {new Date(connection.created_at).toLocaleDateString()}</p>
                  <p><span className="font-medium">Access expires:</span> {new Date(connection.expires_at).toLocaleDateString()}</p>
                </div>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-500">
              Your CNSTRCT account is connected to QuickBooks Online. This allows you to sync invoices, expenses, and other financial data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p>
              Connect your CNSTRCT account with QuickBooks Online to automate your financial workflows.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>Automatically sync invoices to QuickBooks</li>
              <li>Import expenses from QuickBooks</li>
              <li>Keep your financial records in sync</li>
              <li>Reduce manual data entry</li>
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {connection ? (
          <Button 
            variant="destructive" 
            onClick={handleDisconnectQBO}
            disabled={disconnecting}
          >
            {disconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disconnect from QuickBooks
          </Button>
        ) : (
          <Button 
            onClick={handleConnectQBO}
            disabled={connecting}
          >
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect to QuickBooks
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
