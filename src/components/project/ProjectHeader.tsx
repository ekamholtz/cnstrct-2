import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Edit } from "lucide-react";
import { useState } from "react";
import { EditProjectForm } from "./edit/EditProjectForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamMembers, mapUserRoleToUIRole } from "@/hooks/useTeamMembers";
import { UserRole } from "@/components/auth/authSchemas";

interface ProjectHeaderProps {
  name: string;
  address: string;
  projectId: string;
}

export function ProjectHeader({ name, address, projectId }: ProjectHeaderProps) {
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch user role
  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return data?.role;
    }
  });

  // Fetch project data including milestones
  const { data: projectData, refetch } = useQuery({
    queryKey: ['project-edit', projectId],
    queryFn: async () => {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          address,
          milestones (
            id,
            name,
            description,
            amount
          )
        `)
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      return project;
    },
  });

  const handleEditSuccess = () => {
    refetch();
  };

  const isAdmin = (userRole as UserRole) === 'platform_admin';
  const isGeneralContractor = (userRole as UserRole) === 'gc_admin';

  // Determine the back link based on user role
  const backLink = isAdmin ? '/admin/projects' : '/dashboard';

  return (
    <div className="mb-8">
      <div className="mb-8">
        <Link to={backLink}>
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <div className="flex items-center mt-2 text-gray-600">
            <Building2 className="h-4 w-4 mr-2" />
            <p>{address}</p>
          </div>
        </div>
        {isGeneralContractor && (
          <Button onClick={() => setShowEditForm(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project Details
          </Button>
        )}
      </div>

      {projectData && (
        <EditProjectForm
          projectId={projectId}
          initialData={projectData}
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
