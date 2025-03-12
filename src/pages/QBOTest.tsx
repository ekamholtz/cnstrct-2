
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { mapping } from "@/integrations/qbo/mapping";

export default function QBOTest() {
  const { connection, connectToQBO, loading } = useQBOConnection();
  
  useEffect(() => {
    console.log("QBO Connection status:", connection ? "Connected" : "Not connected");
  }, [connection]);
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">QBO Integration Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${connection ? "bg-green-500" : "bg-red-500"}`}></div>
            <p>{connection ? "Connected to QuickBooks Online" : "Not connected"}</p>
          </div>
          
          {!connection && (
            <Button 
              onClick={connectToQBO} 
              disabled={loading}
            >
              {loading ? "Connecting..." : "Connect to QuickBooks"}
            </Button>
          )}
        </CardContent>
      </Card>
      
      {connection && (
        <Card>
          <CardHeader>
            <CardTitle>Test Mapping Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Available mapping functions:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Customer mapping</li>
              <li>Project mapping</li>
              <li>Expense mapping</li>
              <li>Invoice mapping</li>
              <li>Account mapping</li>
            </ul>
            <p className="text-sm text-gray-500">
              Check the console for mapping results when testing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
