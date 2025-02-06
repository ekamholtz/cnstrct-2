
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/landing/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectStatus } from "@/components/project/ProjectStatus";
import { MilestonesList } from "@/components/project/MilestonesList";
import { markMilestoneComplete, calculateCompletion } from "@/utils/milestoneOperations";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";
import { ProjectInvoices } from "@/components/project/invoice/ProjectInvoices";
import { ProjectExpenses } from "@/components/project/expense/ProjectExpenses";
import { ProjectFinancialSummary } from "@/components/project/ProjectFinancialSummary";

interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
  contractor_id: string;
}

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const { toast } = useToast();
  
  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Project;
    },
  });

  // Get current user to check if they are the contractor
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  // Fetch milestones
  const { data: milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleMarkComplete = async (milestoneId: string) => {
    try {
      const invoice = await markMilestoneComplete(milestoneId);
      
      toast({
        title: "Success",
        description: `Milestone marked as complete and invoice #${invoice.invoice_number} has been generated.`,
      });

      refetchMilestones();
    } catch (error) {
      console.error('Error in handleMarkComplete:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update milestone status and generate invoice.",
      });
    }
  };

  if (projectLoading || milestonesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="mb-8">
            <Link to="/client-dashboard">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <ClientPageHeader 
            pageTitle="Project Details"
            pageDescription="Loading project information..."
          />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="mb-8">
            <Link to="/client-dashboard">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <ClientPageHeader 
            pageTitle="Project Not Found"
            pageDescription="The project you're looking for doesn't exist or you don't have access to it."
          />
        </main>
      </div>
    );
  }

  const completionPercentage = calculateCompletion(milestones || []);
  const isContractor = currentUser?.id === project.contractor_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <Link to="/client-dashboard">
            <Button variant="ghost" className="text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <ClientPageHeader 
          pageTitle={`Project: ${project.name}`}
          pageDescription="View project details and track progress"
        />
        <ProjectHeader 
          name={project.name} 
          address={project.address} 
          projectId={project.id}
        />
        <ProjectFinancialSummary projectId={project.id} />
        <div className="mb-8">
          <ProjectStatus status={project.status} completionPercentage={completionPercentage} />
        </div>
        <div className="space-y-8">
          <MilestonesList 
            milestones={milestones || []} 
            onMarkComplete={handleMarkComplete}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <ProjectInvoices projectId={project.id} />
          {isContractor && <ProjectExpenses projectId={project.id} />}
        </div>
      </main>
    </div>
  );
}
