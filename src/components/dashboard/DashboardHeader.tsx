
import { UserNav } from "@/components/ui/user-nav";
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
      <div className="flex items-center space-x-4">
        <ProjectCreationForm onSuccess={onProjectCreated} />
        <UserNav />
      </div>
    </div>
  );
}
