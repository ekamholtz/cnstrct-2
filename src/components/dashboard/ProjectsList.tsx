
import { Project } from "@/types/project";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateProjectCompletion } from "@/utils/project-calculations";

interface ProjectsListProps {
  projects: Project[];
  loading: boolean;
}

export function ProjectsList({ projects, loading }: ProjectsListProps) {
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

  const getProjectMilestones = (projectId: string) => {
    if (!milestones) return [];
    return milestones.filter(m => m.project_id === projectId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {projects.length > 0 ? (
          projects.map((project) => (
            <Link 
              key={project.id} 
              to={`/project/${project.id}`}
              className="block"
            >
              <div className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.address}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">{calculateProjectCompletion(getProjectMilestones(project.id))}% Complete</span>
                  </div>
                  <Progress value={calculateProjectCompletion(getProjectMilestones(project.id))} className="h-2" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center p-8 text-gray-500">
            No projects found. Create your first project to get started.
          </div>
        )}
      </div>
    </div>
  );
}
