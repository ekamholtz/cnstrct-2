
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const useProjectCreation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createProject = async (projectData: any) => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          address: projectData.address,
          contractor_id: user.id,
          status: 'active',
          client_id: projectData.client_id
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create milestones
      if (projectData.milestones?.length > 0) {
        const milestonesData = projectData.milestones.map((milestone: any) => ({
          name: milestone.name,
          amount: milestone.amount,
          description: milestone.description,
          project_id: project.id
        }));

        const { error: milestonesError } = await supabase
          .from('milestones')
          .insert(milestonesData);

        if (milestonesError) throw milestonesError;
      }

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      navigate(`/project/${project.id}`);
      return project;
    } catch (error) {
      console.error('Error in project creation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProject,
    isLoading
  };
};
