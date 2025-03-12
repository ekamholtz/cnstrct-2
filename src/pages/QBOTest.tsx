
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { QBOMappingService } from "@/integrations/qbo/mapping";
import { QBOService } from "@/integrations/qbo/qboService";

export default function QBOTest() {
  const { connection, isConnecting } = useQBOConnection();
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const testQBOConnection = async () => {
    setIsLoading(true);
    try {
      const qboService = new QBOService();
      const mappingService = new QBOMappingService();
      
      const connectionInfo = await qboService.getUserConnection();
      
      if (!connectionInfo) {
        setTestResult('No QBO connection found. Please connect your QuickBooks account in settings.');
        return;
      }
      
      // Test getting accounts
      const accounts = await qboService.getAccounts();
      
      if (accounts && accounts.length > 0) {
        // Test mapping service
        const mappedAccounts = mappingService.mapAccountsToSelectOptions(accounts);
        setTestResult(`Connection successful! Found ${mappedAccounts.length} accounts.`);
      } else {
        setTestResult('Connection successful, but no accounts found.');
      }
    } catch (error) {
      console.error("QBO Test Error:", error);
      setTestResult(`Error testing QBO connection: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">QuickBooks Online Connection Test</h1>
      
      <Card className="p-4 mb-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Connection Status</h2>
          <p>{connection ? "Connected to QuickBooks" : "Not connected to QuickBooks"}</p>
        </div>
        
        <Button 
          onClick={testQBOConnection} 
          disabled={isLoading || isConnecting || !connection}
        >
          {isLoading ? "Testing..." : "Test QBO Connection"}
        </Button>
        
        {testResult && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <pre className="whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}
