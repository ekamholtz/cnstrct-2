
import { MapPin } from "lucide-react";
import { ClientProject } from "@/types/project-types";

interface ProjectHeaderProps {
  project: ClientProject;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-[#172b70] mb-2">{project.name}</h1>
      <div className="flex items-center text-gray-600">
        <MapPin className="h-4 w-4 mr-2" />
        <span>{project.address}</span>
      </div>
    </div>
  );
}
