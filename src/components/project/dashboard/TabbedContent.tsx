import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectInvoices } from "@/components/project/invoice/ProjectInvoices";
import { HomeownerExpenses } from "@/components/homeowner/expenses/HomeownerExpenses";
import { ProjectFiles } from "@/components/project/files/ProjectFiles";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TabbedContentProps {
  projectId: string;
  isHomeowner: boolean;
}

// Fallback UI for errors
const ErrorFallback = ({ title, message }: { title: string, message: string }) => (
  <Alert className="my-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

export function TabbedContent({ projectId, isHomeowner }: TabbedContentProps) {
  // Calculate the number of tabs for grid layout
  const tabCount = isHomeowner ? 3 : 2; // 3 tabs for homeowner, 2 for others
  
  return (
    <Tabs defaultValue="invoices" className="w-full">
      <TabsList className="w-full grid bg-white border-b" style={{ gridTemplateColumns: isHomeowner ? '1fr 1fr 1fr' : '1fr 1fr' }}>
        <TabsTrigger 
          value="invoices" 
          className="flex-1 data-[state=active]:text-[#172b70] data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b24]"
        >
          Invoices
        </TabsTrigger>
        {isHomeowner && (
          <TabsTrigger 
            value="expenses" 
            className="flex-1 data-[state=active]:text-[#172b70] data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b24]"
          >
            My Expenses
          </TabsTrigger>
        )}
        <TabsTrigger 
          value="files" 
          className="flex-1 data-[state=active]:text-[#172b70] data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b24]"
        >
          Documents
        </TabsTrigger>
      </TabsList>
      <TabsContent value="invoices" className="mt-6">
        <ErrorBoundary
          fallback={
            <ErrorFallback 
              title="Error Loading Invoices" 
              message="There was a problem loading the invoices for this project. Please try refreshing the page." 
            />
          }
        >
          <ProjectInvoices projectId={projectId} />
        </ErrorBoundary>
      </TabsContent>
      {isHomeowner && (
        <TabsContent value="expenses" className="mt-6">
          <ErrorBoundary
            fallback={
              <ErrorFallback 
                title="Error Loading Expenses" 
                message="There was a problem loading your expenses for this project. Please try refreshing the page." 
              />
            }
          >
            <HomeownerExpenses projectId={projectId} />
          </ErrorBoundary>
        </TabsContent>
      )}
      <TabsContent value="files" className="mt-6">
        <ErrorBoundary
          fallback={
            <ErrorFallback 
              title="Error Loading Documents" 
              message="There was a problem loading the documents for this project. Please try refreshing the page." 
            />
          }
        >
          <ProjectFiles projectId={projectId} userRole={isHomeowner ? "homeowner" : "client"} />
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
}
