
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectInvoices } from "@/components/project/invoice/ProjectInvoices";
import { ProjectExpenses } from "@/components/project/ProjectExpenses";

interface GCTabbedContentProps {
  projectId: string;
  expenses: any[];
}

export function GCTabbedContent({ projectId, expenses }: GCTabbedContentProps) {
  return (
    <Tabs defaultValue="invoices" className="w-full">
      <TabsList className="w-full bg-white border-b">
        <TabsTrigger 
          value="invoices" 
          className="flex-1 data-[state=active]:text-[#172b70] data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b24]"
        >
          Invoices
        </TabsTrigger>
        <TabsTrigger 
          value="expenses" 
          className="flex-1 data-[state=active]:text-[#172b70] data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b24]"
        >
          Expenses
        </TabsTrigger>
      </TabsList>
      <TabsContent value="invoices" className="mt-6">
        <div className="px-6">
          <ProjectInvoices projectId={projectId} />
        </div>
      </TabsContent>
      <TabsContent value="expenses" className="mt-6">
        <ProjectExpenses projectId={projectId} expenses={expenses} />
      </TabsContent>
    </Tabs>
  );
}
