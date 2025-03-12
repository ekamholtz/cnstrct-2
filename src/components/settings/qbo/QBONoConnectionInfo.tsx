
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface QBONoConnectionInfoProps {
  isSandboxMode: boolean;
}

export function QBONoConnectionInfo({ isSandboxMode }: QBONoConnectionInfoProps) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
        <h3 className="font-semibold text-amber-800 mb-2">Not Connected</h3>
        <p className="text-amber-700 text-sm">
          Connect your QuickBooks Online account to enable financial data sync from CNSTRCT to QBO.
        </p>
        {isSandboxMode && (
          <div className="mt-3 space-y-2">
            <p className="text-amber-700 text-sm font-medium">
              You are in development mode. A QuickBooks Sandbox account is required for testing.
            </p>
            
            <Alert variant="warning" className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-800" />
              <AlertTitle className="text-amber-800 text-xs font-bold">QuickBooks Developer Setup</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs">
                <p className="mb-1">When registering your app in the Intuit Developer Portal, use:</p>
                <ul className="list-disc list-inside text-amber-700 space-y-1 pl-2">
                  <li><span className="font-semibold">Host domain:</span> localhost (without port)</li>
                  <li><span className="font-semibold">Launch/Disconnect URLs:</span> https://localhost/settings (with https)</li>
                  <li><span className="font-semibold">Callback URL:</span> https://localhost/qbo/callback (with https)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
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
  );
}
