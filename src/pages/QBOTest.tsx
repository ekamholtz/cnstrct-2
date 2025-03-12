import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mappingService";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function QBOTest() {
  const { connection, isLoading, error, connectToQBO } = useQBOConnection();
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [testUser, setTestUser] = useState<string>("tgc1@email.com");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  
  const fetchAccounts = async () => {
    try {
      const accountsList = await qboService.getAccounts("Expense");
      setAccounts(mappingService.mapAccountsToSelectOptions(accountsList));
      toast({
        title: "Accounts Fetched",
        description: `Retrieved ${accountsList.length} expense accounts from QuickBooks Online.`,
      });
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        variant: "destructive",
        title: "Error Fetching Accounts",
        description: error instanceof Error ? error.message : "Failed to fetch accounts from QuickBooks Online",
      });
    }
  };
  
  const testSync = async () => {
    if (!selectedAccount) {
      toast({
        variant: "destructive",
        title: "No Account Selected",
        description: "Please select an expense account first.",
      });
      return;
    }
    
    try {
      setSyncStatus("loading");
      setSyncError(null);
      
      // Find test user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', testUser)
        .single();
        
      if (profileError || !profile) {
        throw new Error(`Test user ${testUser} not found`);
      }
      
      // Find a test expense for the user
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', profile.id)
        .limit(1)
        .single();
        
      if (expenseError || !expense) {
        throw new Error(`No expense found for test user ${testUser}`);
      }
      
      // Check if the expense is already synced
      const existingRef = await qboService.getEntityReference(expense.id, 'expense');
      if (existingRef) {
        throw new Error("This expense is already synced to QuickBooks Online");
      }
      
      // Find or create the vendor in QBO
      let vendorId: string;
      const vendorEmail = expense.payee || 'unknown@example.com';
      
      const existingVendor = await qboService.findCustomerByEmail(vendorEmail);
      if (existingVendor) {
        vendorId = existingVendor.Id;
      } else {
        // Create new vendor
        const newVendor = {
          DisplayName: expense.payee || 'Unknown Vendor',
          PrimaryEmailAddr: {
            Address: vendorEmail
          }
        };
        
        const createdVendor = await qboService.createCustomer(newVendor);
        vendorId = createdVendor.Id;
      }
      
      // Map the expense to a QBO bill
      const bill = mappingService.mapExpenseToBill(expense, vendorId, selectedAccount);
      
      // Create the bill in QBO
      const createdBill = await qboService.createBill(bill);
      
      // Store the reference to the QBO entity
      await qboService.storeEntityReference(
        expense.id,
        'expense',
        createdBill.Id,
        'bill'
      );
      
      // Log the sync
      if (user) {
        await supabase.from('qbo_sync_logs').insert({
          user_id: user.id,
          qbo_reference_id: (await qboService.getEntityReference(expense.id, 'expense'))?.id,
          action: 'create',
          status: 'success',
          payload: bill as any,
          response: createdBill as any
        });
      }
      
      setSyncStatus("success");
      toast({
        title: "Sync Successful",
        description: `Expense ${expense.id} successfully synced to QuickBooks Online as Bill #${createdBill.DocNumber || createdBill.Id}`,
      });
    } catch (error) {
      console.error("Error syncing to QBO:", error);
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : String(error));
      
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync expense to QuickBooks Online",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">QuickBooks Online Test</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>QBO Connection Status</CardTitle>
            <CardDescription>
              Check your connection to QuickBooks Online
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>
                  {error.message || "Failed to connect to QuickBooks Online"}
                </AlertDescription>
              </Alert>
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
                      <span className="text-muted-foreground">Company ID:</span>
                      <span>{connection.company_id}</span>
                    </div>
                  </div>
                </div>
                
                <Button onClick={fetchAccounts}>
                  Fetch QBO Accounts
                </Button>
                
                {accounts.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      Select Expense Account
                    </label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                    >
                      <option value="">Select an account...</option>
                      {accounts.map((account) => (
                        <option key={account.value} value={account.value}>
                          {account.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="warning" className="bg-amber-50 border-amber-200">
                  <AlertTitle className="text-amber-800">Not Connected</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    You need to connect to QuickBooks Online to test the integration.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            {!isLoading && !connection && (
              <Button onClick={connectToQBO}>
                Connect to QuickBooks Online
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {connection && (
          <Card>
            <CardHeader>
              <CardTitle>Test Sync for {testUser}</CardTitle>
              <CardDescription>
                Sync a test expense from this user to QuickBooks Online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={testUser}
                    onChange={(e) => setTestUser(e.target.value)}
                    className="flex-1 p-2 border rounded-md"
                    placeholder="Email of test user"
                  />
                </div>
                
                {syncStatus === "loading" && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-muted-foreground">Syncing expense to QuickBooks Online...</p>
                  </div>
                )}
                
                {syncStatus === "success" && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Sync Successful</AlertTitle>
                    <AlertDescription className="text-green-700">
                      The expense was successfully synced to QuickBooks Online.
                    </AlertDescription>
                  </Alert>
                )}
                
                {syncStatus === "error" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Sync Failed</AlertTitle>
                    <AlertDescription>
                      {syncError || "Failed to sync expense to QuickBooks Online"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={testSync} 
                disabled={syncStatus === "loading" || !selectedAccount}
              >
                Test Sync
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
