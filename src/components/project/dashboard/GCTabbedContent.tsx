import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectExpenses } from "@/components/project/ProjectExpenses";
import { ProjectInvoices } from "@/components/project/invoice/ProjectInvoices";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface GCTabbedContentProps {
  projectId: string;
  expenses?: any[];
  invoices?: any[];
}

// Fallback UI for errors
const ErrorFallback = ({ title, message }: { title: string, message: string }) => (
  <Alert className="my-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

export function GCTabbedContent({ projectId, expenses = [], invoices = [] }: GCTabbedContentProps) {
  // Ensure expenses and invoices are always arrays
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  // Safe rendering function for ProjectExpenses
  const renderProjectExpenses = () => {
    try {
      if (!projectId) {
        return (
          <ErrorFallback 
            title="Missing Project ID" 
            message="No project ID was provided. Please try refreshing the page." 
          />
        );
      }
      
      // Wrap the ProjectExpenses component in a try-catch block
      try {
        return <ProjectExpenses projectId={projectId} expenses={safeExpenses} />;
      } catch (error) {
        console.error("Error rendering ProjectExpenses:", error);
        return (
          <ErrorFallback 
            title="Error Loading Expenses" 
            message={`There was a problem loading the expenses for this project: ${error instanceof Error ? error.message : 'Unknown error'}. Please try refreshing the page.`} 
          />
        );
      }
    } catch (error) {
      console.error("Error in renderProjectExpenses:", error);
      return (
        <ErrorFallback 
          title="Error Loading Expenses" 
          message="There was a problem loading the expenses for this project. Please try refreshing the page." 
        />
      );
    }
  };

  return (
    <Tabs defaultValue="expenses" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
      </TabsList>
      <TabsContent value="expenses">
        {renderProjectExpenses()}
      </TabsContent>
      <TabsContent value="invoices">
        <ErrorBoundary
          fallback={
            <ErrorFallback 
              title="Error Loading Invoices" 
              message="There was a problem loading the invoices for this project. Please try refreshing the page." 
            />
          }
        >
          <ProjectInvoices projectId={projectId} invoices={safeInvoices} />
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
}
