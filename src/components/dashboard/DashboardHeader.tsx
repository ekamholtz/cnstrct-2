
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardHeaderProps {
  onProjectCreated: () => void;
}

export function DashboardHeader({ onProjectCreated }: DashboardHeaderProps) {
  const { data: profile } = useQuery({
    queryKey: ['contractor-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        {profile?.company_name && (
          <p className="text-xl font-bold text-gray-700 mb-2">{profile.company_name}</p>
        )}
        <h1 className="text-2xl font-bold text-gray-900">General Contractor Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your projects and track progress</p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Fill in the project details below to create a new project.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-180px)] pr-6">
            <div className="pb-6">
              <ProjectCreationForm onSuccess={onProjectCreated} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
