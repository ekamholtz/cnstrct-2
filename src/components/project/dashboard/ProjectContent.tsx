
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectInvoices } from "../ProjectInvoices";
import { ProjectExpenses } from "../ProjectExpenses";
import { MilestonesList } from "../MilestonesList";
import { ProjectFinancialOverview } from "../ProjectFinancialOverview";

interface ProjectContentProps {
  projectId: string;
}

export function ProjectContent({ projectId }: ProjectContentProps) {
  useEffect(() => {
    console.log("ProjectContent mounted with projectId:", projectId);
  }, [projectId]);

  return (
    <div className="space-y-8">
      <ProjectFinancialOverview projectId={projectId} />
      <Tabs defaultValue="milestones" className="w-full">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="milestones">
          <MilestonesList projectId={projectId} />
        </TabsContent>
        <TabsContent value="invoices">
          <ProjectInvoices projectId={projectId} />
        </TabsContent>
        <TabsContent value="expenses">
          <ProjectExpenses projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
