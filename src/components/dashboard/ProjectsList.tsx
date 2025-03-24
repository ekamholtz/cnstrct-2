import { Project } from "@/types/project";
import { Link, useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateProjectCompletion } from "@/utils/project-calculations";
import { ProjectCard } from "./ProjectCard";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectsListProps {
  projects: Project[];
  loading: boolean;
}

export function ProjectsList({ projects, loading }: ProjectsListProps) {
  const location = useLocation();
  const isProjectsPage = location.pathname === "/gc-projects";

  // Query to fetch any additional milestone data if needed
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
      return data as any[];
    },
    enabled: projects.length > 0,
  });

  const getProjectMilestones = (projectId: string) => {
    if (!milestones) return [];
    // Filter milestones for specific project
    return milestones.filter(m => m && typeof m === 'object' && m.project_id === projectId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cnstrct-navy"></div>
      </div>
    );
  }

  // Sort projects by creation date (newest first)
  const sortedProjects = [...projects].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  // Show all projects if on the projects page, otherwise show only the most recent 3
  const displayedProjects = isProjectsPage ? sortedProjects : sortedProjects.slice(0, 3);

  return (
    <div>
      {projects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          
          {!isProjectsPage && projects.length > 3 && (
            <div className="mt-6 flex justify-center">
              <Link to="/gc-projects">
                <Button variant="outline" className="group">
                  View All Projects
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-cnstrct-grayDark/10 p-3">
              <Plus className="h-6 w-6 text-cnstrct-navy" />
            </div>
            <h3 className="text-lg font-medium text-cnstrct-navy">No projects found</h3>
            <p className="text-gray-500 max-w-md">
              Create your first project to start tracking progress and managing your construction workflow.
            </p>
            <Link to="/create-project">
              <Button className="mt-2 bg-cnstrct-navy hover:bg-cnstrct-navy/90">
                Create Project
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
