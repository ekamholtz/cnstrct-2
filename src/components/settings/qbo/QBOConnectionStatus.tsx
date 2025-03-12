
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
}

interface QBOConnectionStatusProps {
  error: Error | null;
  testResult?: TestResult | null;
}

export function QBOConnectionStatus({ error, testResult }: QBOConnectionStatusProps) {
  return (
    <>
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
    </>
  );
}
