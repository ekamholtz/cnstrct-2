import React, { useState, useEffect } from "react";
import { useReporting } from "@/hooks/useReporting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfitLossReport } from "@/components/reporting/ProfitLossReport";
import { SalesmanReport } from "@/components/reporting/SalesmanReport";
import { ProjectTypeReport } from "@/components/reporting/ProjectTypeReport";
import { TrendAnalysisReport } from "@/components/reporting/TrendAnalysisReport";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ReportingDashboard = () => {
  const [activeTab, setActiveTab] = useState("profit-loss");
  const { 
    historicalProjects, 
    projectsByPM, 
    projectsByType, 
    monthlyFinancialData,
    isLoading, 
    error,
    refetchProjects 
  } = useReporting();

  useEffect(() => {
    console.log("ReportingDashboard - Data loaded:", {
      historicalProjects: historicalProjects?.length || 0,
      projectsByPM: projectsByPM?.length || 0,
      projectsByType: projectsByType?.length || 0,
      monthlyFinancialData: monthlyFinancialData?.length || 0,
      isLoading,
      error: error ? error.message : null
    });
  }, [historicalProjects, projectsByPM, projectsByType, monthlyFinancialData, isLoading, error]);

  const handleRefresh = () => {
    console.log("Refreshing reporting data...");
    refetchProjects();
  };

  // Check if we have any data to display
  const hasData = 
    (historicalProjects && historicalProjects.length > 0) || 
    (projectsByPM && projectsByPM.length > 0) || 
    (projectsByType && projectsByType.length > 0) || 
    (monthlyFinancialData && monthlyFinancialData.length > 0);

  return (
    <div className="container mx-auto pt-20 pb-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Financial Reporting"
          description="View and analyze financial data across all your projects"
        />
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message || "Failed to load reporting data. Please try refreshing."}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && !hasData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No project data is available for reporting. This could be because:
            <ul className="list-disc ml-6 mt-2">
              <li>You don't have any completed projects yet</li>
              <li>Your projects don't have any invoices or expenses recorded</li>
              <li>You need to refresh the data</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="by-salesman">By Project Manager</TabsTrigger>
          <TabsTrigger value="by-type">By Project Type</TabsTrigger>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <ProfitLossReport projects={historicalProjects || []} />
          )}
        </TabsContent>

        <TabsContent value="by-salesman" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <SalesmanReport projectsByPM={projectsByPM || []} />
          )}
        </TabsContent>

        <TabsContent value="by-type" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <ProjectTypeReport projectsByType={projectsByType || []} />
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <TrendAnalysisReport monthlyData={monthlyFinancialData || []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingDashboard;
