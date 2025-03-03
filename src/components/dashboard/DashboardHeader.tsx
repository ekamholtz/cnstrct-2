
import ProjectCreationForm from "@/components/projects/ProjectCreationForm";

interface DashboardHeaderProps {
  onProjectCreated?: () => void;
}

export function DashboardHeader({ onProjectCreated }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Manage your construction projects</p>
      </div>
      <div className="flex items-center">
        <ProjectCreationForm onSuccess={onProjectCreated} />
      </div>
    </div>
  );
}
