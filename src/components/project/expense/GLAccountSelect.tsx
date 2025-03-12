
import React from "react";
import { useQBOAccounts } from "@/hooks/useQBOAccounts";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface GLAccountSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function GLAccountSelect({ value, onChange, required = false }: GLAccountSelectProps) {
  const { connection } = useQBOConnection();
  const { accounts, isLoading, error } = useQBOAccounts('Expense');
  
  if (!connection) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      <Label htmlFor="gl-account" className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
        QuickBooks Expense Account
      </Label>
      
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : error ? (
        <div className="text-sm text-red-500">
          Error loading QuickBooks accounts. Please refresh and try again.
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-sm text-amber-600">
          No expense accounts found in your QuickBooks account.
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="gl-account" className="w-full">
            <SelectValue placeholder="Select a GL account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.value} value={account.value} className="text-sm">
                {account.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {connection && (
        <p className="text-xs text-muted-foreground">
          This expense will be synced with your QuickBooks Online account.
        </p>
      )}
    </div>
  );
}
