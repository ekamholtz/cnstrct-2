
import { Project } from "@/types/project";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateProjectCompletion } from "@/utils/project-calculations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="relative">
      {projects.length > 3 && (
        <Button
          onClick={() => scroll('left')}
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md hover:bg-gray-50 border-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto py-4 gap-6 px-2 hide-scrollbar scroll-smooth snap-x"
      >
        {projects.map((project) => (
          <Link 
            key={project.id} 
            to={`/project/${project.id}`}
            className="block flex-none w-[calc(33.333%-16px)] min-w-[320px] snap-start"
          >
            <div className="h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.address}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status === 'active' ? 'active' : project.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">{calculateProjectCompletion(getProjectMilestones(project.id))}% Complete</span>
                  </div>
                  <Progress 
                    value={calculateProjectCompletion(getProjectMilestones(project.id))} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {projects.length > 3 && (
        <Button
          onClick={() => scroll('right')}
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md hover:bg-gray-50 border-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
