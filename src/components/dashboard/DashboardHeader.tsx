import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectCreationForm from "@/components/projects/ProjectCreationForm";

interface DashboardHeaderProps {
  onProjectCreated: () => void;
}

export function DashboardHeader({ onProjectCreated }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">General Contractor Dashboard</h1>
        <p className="text-gray-600">Manage your projects and track progress</p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Fill in the project details below to create a new project.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-120px)] pr-4">
            <ProjectCreationForm onSuccess={onProjectCreated} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}