import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useCommissionData } from "@/hooks";
import { formatCurrency } from "@/lib/utils";

interface CommissionCalculatorProps {
  projectId: string;
  userRole: string | null;
}

export function CommissionCalculator({ projectId, userRole }: CommissionCalculatorProps) {
  const { toast } = useToast();
  const isAdmin = userRole === "gc_admin" || userRole === "platform_admin";
  
  const { 
    commissionData, 
    isLoading, 
    updateCommissionSettings,
    totalContractValue,
    totalCollected,
    totalExpensesPaid
  } = useCommissionData(projectId);

  const [officeOverheadPercentage, setOfficeOverheadPercentage] = useState<number>(0);
  const [pmProfitSplitPercentage, setPmProfitSplitPercentage] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (commissionData) {
      setOfficeOverheadPercentage(commissionData.office_overhead_percentage || 0);
      setPmProfitSplitPercentage(commissionData.pm_profit_split_percentage || 0);
    }
  }, [commissionData]);

  const handleSave = async () => {
    try {
      await updateCommissionSettings({
        office_overhead_percentage: officeOverheadPercentage,
        pm_profit_split_percentage: pmProfitSplitPercentage
      });
      setIsEditing(false);
      toast({
        title: "Settings saved",
        description: "Commission settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving commission settings:", error);
      toast({
        title: "Error",
        description: "Failed to save commission settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate commission values
  const totalRevenue = totalCollected || 0;
  const totalExpenses = totalExpensesPaid || 0;
  const grossProfit = totalRevenue - totalExpenses;
  const officeOverhead = (grossProfit * officeOverheadPercentage) / 100;
  const remainingProfit = grossProfit - officeOverhead;
  const pmCommission = (remainingProfit * pmProfitSplitPercentage) / 100;
  const companyProfit = remainingProfit - pmCommission;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Calculator</CardTitle>
          <CardDescription>Loading commission data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Commission Calculator</CardTitle>
        <CardDescription>
          Calculate the commission for the project manager based on project financials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Financial Data Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Project Financial Data</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Contract Value</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded-md">
                  {formatCurrency(totalContractValue || 0)}
                </div>
              </div>
              
              <div>
                <Label>Total Collected</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded-md">
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
              
              <div>
                <Label>Total Expenses Paid</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded-md">
                  {formatCurrency(totalExpenses)}
                </div>
              </div>
              
              <div>
                <Label>Gross Profit</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded-md">
                  {formatCurrency(grossProfit)}
                </div>
              </div>
            </div>
          </div>

          {/* Commission Settings Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Commission Settings</h3>
              {isAdmin && !isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
              {isAdmin && isEditing && (
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="officeOverheadPercentage">
                  Office Overhead Percentage (%)
                </Label>
                {isEditing && isAdmin ? (
                  <Input
                    id="officeOverheadPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={officeOverheadPercentage}
                    onChange={(e) => setOfficeOverheadPercentage(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-gray-100 rounded-md">
                    {officeOverheadPercentage}%
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="pmProfitSplitPercentage">
                  PM Profit Split Percentage (%)
                </Label>
                {isEditing && isAdmin ? (
                  <Input
                    id="pmProfitSplitPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={pmProfitSplitPercentage}
                    onChange={(e) => setPmProfitSplitPercentage(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-gray-100 rounded-md">
                    {pmProfitSplitPercentage}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Commission Calculation Results */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Commission Calculation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-md shadow-sm">
              <div className="text-sm text-gray-500">Office Overhead</div>
              <div className="text-xl font-semibold">{formatCurrency(officeOverhead)}</div>
            </div>
            
            <div className="p-3 bg-white rounded-md shadow-sm">
              <div className="text-sm text-gray-500">PM Commission</div>
              <div className="text-xl font-semibold text-green-600">{formatCurrency(pmCommission)}</div>
            </div>
            
            <div className="p-3 bg-white rounded-md shadow-sm">
              <div className="text-sm text-gray-500">Company Profit</div>
              <div className="text-xl font-semibold text-blue-600">{formatCurrency(companyProfit)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
