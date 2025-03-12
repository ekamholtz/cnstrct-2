
import React, { useState } from "react";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { QBOService } from "@/integrations/qbo/qboService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";

export function QBOSettings() {
  const { connection, isLoading, error, connectToQBO, disconnectFromQBO } = useQBOConnection();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect from QuickBooks Online? This will stop all syncing.")) {
      await disconnectFromQBO();
      setTestResult(null);
    }
  };
  
  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Make a simple API call to test the connection
      const response = await fetch("https://sandbox-quickbooks.api.intuit.com/v3/company", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        }
      });
      
      if (response.ok) {
        setTestResult({ 
          success: true, 
          message: "Connection to QuickBooks API is working properly." 
        });
      } else {
        const errorText = await response.text();
        setTestResult({ 
          success: false, 
          message: `Connection test failed: ${response.status} ${response.statusText}. ${errorText}` 
        });
      }
    } catch (err) {
      setTestResult({ 
        success: false, 
        message: `Connection test failed: ${err instanceof Error ? err.message : String(err)}` 
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  // Check if we're in development/sandbox mode
  const isSandboxMode = window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('127.0.0.1');
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">QuickBooks Online Integration</CardTitle>
        <CardDescription>
          Connect your QuickBooks Online account to sync financial data from CNSTRCT
          {isSandboxMode && (
            <span className="block mt-2 text-amber-500 font-medium">
              Development Mode: Using QuickBooks Sandbox
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {error.message || "An error occurred with your QuickBooks Online connection"}
            </AlertDescription>
          </Alert>
        )}
        
        {testResult && (
          <Alert 
            variant={testResult.success ? "default" : "destructive"} 
            className={`mb-4 ${testResult.success ? "bg-green-50 border-green-200" : ""}`}
          >
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{testResult.success ? "Test Successful" : "Test Failed"}</AlertTitle>
            <AlertDescription>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : connection ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Connected to QuickBooks Online</span>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-semibold mb-2">Connection Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{connection.company_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment:</span>
                  <span>{isSandboxMode ? "Sandbox (Test)" : "Production"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connected:</span>
                  <span>{formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{formatDistanceToNow(new Date(connection.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">Syncing Information</h3>
              <p className="text-blue-700 text-sm">
                Data is synced one-way from CNSTRCT to QuickBooks Online:
              </p>
              <ul className="list-disc list-inside text-blue-700 text-sm mt-2 space-y-1">
                <li>Clients are synced as Customers</li>
                <li>Expenses are synced as Bills</li>
                <li>Expense payments are synced as Bill Payments</li>
                <li>Invoices are synced as Invoices</li>
                <li>Invoice payments are synced as Payments</li>
                <li>Projects are tagged in QBO transactions</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
              <h3 className="font-semibold text-amber-800 mb-2">Not Connected</h3>
              <p className="text-amber-700 text-sm">
                Connect your QuickBooks Online account to enable financial data sync from CNSTRCT to QBO.
              </p>
              {isSandboxMode && (
                <p className="text-amber-700 text-sm mt-2 font-medium">
                  You are in development mode. A QuickBooks Sandbox account is required for testing.
                </p>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">What Will Be Synced</h3>
              <p className="text-blue-700 text-sm">
                Data will flow one-way from CNSTRCT to QuickBooks Online:
              </p>
              <ul className="list-disc list-inside text-blue-700 text-sm mt-2 space-y-1">
                <li>Clients → Customers in QBO</li>
                <li>Expenses → Bills in QBO</li>
                <li>Expense Payments → Bill Payments in QBO</li>
                <li>Invoices → Invoices in QBO</li>
                <li>Invoice Payments → Payments in QBO</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {!isLoading && (
          connection ? (
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={testConnection}
                disabled={isTesting}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(isSandboxMode ? 
                  "https://sandbox.qbo.intuit.com/app/homepage" : 
                  "https://qbo.intuit.com", 
                  "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open QuickBooks
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connectToQBO}>
              Connect to QuickBooks Online
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
}
