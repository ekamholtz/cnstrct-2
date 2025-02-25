
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectInvoices } from "@/components/project/invoice/ProjectInvoices";
import { HomeownerExpenses } from "@/components/homeowner/expenses/HomeownerExpenses";

interface TabbedContentProps {
  projectId: string;
  isHomeowner: boolean;
}

export function TabbedContent({ projectId, isHomeowner }: TabbedContentProps) {
  return (
    <Tabs defaultValue="invoices" className="w-full">
      <TabsList className="w-full bg-white border-b">
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
      </TabsList>
      <TabsContent value="invoices" className="mt-6">
        <ProjectInvoices projectId={projectId} />
      </TabsContent>
      {isHomeowner && (
        <TabsContent value="expenses" className="mt-6">
          <HomeownerExpenses projectId={projectId} />
        </TabsContent>
      )}
    </Tabs>
  );
}
