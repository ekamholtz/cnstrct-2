import { Project } from "@/types/project";

interface ProjectsListProps {
  projects: Project[];
  loading: boolean;
}

export function ProjectsList({ projects, loading }: ProjectsListProps) {
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
            <div key={project.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
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
            </div>
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