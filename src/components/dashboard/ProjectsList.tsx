
import { Project } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateProjectCompletion } from "@/utils/project-calculations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ExpandableProjectCard } from "@/components/ui/expandable-card";
import { motion } from "framer-motion";

interface ProjectsListProps {
  projects: Project[];
  loading: boolean;
}

export function ProjectsList({ projects, loading }: ProjectsListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Query to fetch milestones for all projects
  const { data: milestones } = useQuery({
    queryKey: ['all-projects-milestones', projects.map(p => p.id)],
    queryFn: async () => {
      if (projects.length === 0) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      console.log("Fetching milestones for projects:", projects.map(p => p.id));
      
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .in('project_id', projects.map(p => p.id));
      
      if (error) {
        console.error('Error fetching milestones:', error);
        throw error;
      }
      
      console.log("Fetched milestones:", data);
      return data;
    },
    enabled: projects.length > 0,
  });

  // Query to fetch project managers and clients
  const { data: projectDetails } = useQuery({
    queryKey: ['project-details', projects.map(p => p.id)],
    queryFn: async () => {
      if (projects.length === 0) return {};
      
      // Fetch project managers
      const { data: projectManagers, error: pmError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', projects.filter(p => p.pm_user_id).map(p => p.pm_user_id));
      
      if (pmError) {
        console.error('Error fetching project managers:', pmError);
        throw pmError;
      }

      // Fetch clients
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, name, email, phone_number')
        .in('id', projects.filter(p => p.client_id).map(p => p.client_id));
      
      if (clientError) {
        console.error('Error fetching clients:', clientError);
        throw clientError;
      }

      // Organize data by project
      const details: Record<string, { 
        projectManager?: typeof projectManagers[0], 
        client?: typeof clients[0],
        contractValue?: number
      }> = {};

      // Calculate contract value for each project (sum of milestone amounts)
      const projectContractValues: Record<string, number> = {};
      if (milestones) {
        for (const milestone of milestones) {
          if (milestone.amount) {
            if (!projectContractValues[milestone.project_id]) {
              projectContractValues[milestone.project_id] = 0;
            }
            projectContractValues[milestone.project_id] += Number(milestone.amount);
          }
        }
      }

      // Map project managers and clients to projects
      projects.forEach(project => {
        details[project.id] = {
          projectManager: projectManagers?.find(pm => pm.id === project.pm_user_id) || null,
          client: clients?.find(c => c.id === project.client_id) || null,
          contractValue: projectContractValues[project.id] || undefined
        };
      });

      return details;
    },
    enabled: projects.length > 0 && !!milestones,
  });

  const getProjectMilestones = (projectId: string) => {
    if (!milestones) return [];
    return milestones.filter(m => m.project_id === projectId);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No projects found. Create your first project to get started.
      </div>
    );
  }

  return (
    <div className="relative px-10">
      {projects.length > 3 && (
        <Button
          onClick={() => scroll('left')}
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md hover:bg-gray-50 border border-gray-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto py-4 gap-6 hide-scrollbar scroll-smooth snap-x"
      >
        {projects.map((project) => {
          const completionPercentage = calculateProjectCompletion(getProjectMilestones(project.id));
          const details = projectDetails?.[project.id] || {};
          
          return (
            <motion.div
              key={project.id}
              className="block flex-none w-[calc(33.333%-16px)] min-w-[320px] snap-start"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <ExpandableProjectCard
                project={project}
                completionPercentage={completionPercentage}
                projectManager={details.projectManager}
                client={details.client}
                contractValue={details.contractValue}
              />
            </motion.div>
          );
        })}
      </div>
      
      {projects.length > 3 && (
        <Button
          onClick={() => scroll('right')}
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md hover:bg-gray-50 border border-gray-200"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
