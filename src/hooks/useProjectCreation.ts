
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ProjectFormValues } from "@/components/projects/types";
import { useMilestonePreparation } from "@/hooks/useMilestonePreparation";
import { 
  getCurrentUserProfile,
  createClient,
  createProject,
  createMilestones
} from "@/services";

export const useProjectCreation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { prepareMilestoneData } = useMilestonePreparation();

  const createProjectFlow = async (projectData: ProjectFormValues) => {
    setIsLoading(true);
    try {
      // Get user profile information
      const { user, userProfile } = await getCurrentUserProfile();
      console.log('Creating project with user profile:', userProfile);

      // Validate that user has a gc_account_id
      if (!userProfile.gc_account_id) {
        throw new Error('You must be associated with a General Contractor company to create projects');
      }

      // Create the client
      const client = await createClient({
        name: projectData.clientName,
        address: projectData.clientAddress,
        email: projectData.clientEmail,
        phone_number: projectData.clientPhone
      });

      // Create the project
      // Always assign the current user as PM for projects they create
      const project = await createProject({
        name: projectData.projectName,
        address: projectData.clientAddress,
        status: 'active',
        client_id: client.id,
        gc_account_id: userProfile.gc_account_id,
        pm_user_id: user.id, // Explicitly set the current user as PM
        description: projectData.projectDescription
      });

      // Handle milestones creation
      if (projectData.milestones?.length > 0) {
        try {
          const milestonesData = prepareMilestoneData(project.id, projectData.milestones);
          await createMilestones(milestonesData);
          console.log(`Successfully created milestones for project: ${project.id}`);
        } catch (milestonesError) {
          console.error('Error creating milestones:', milestonesError);
          // Log but don't throw - we want to return the created project even if milestones fail
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Project created but there was an issue with milestones. Please add them manually.",
          });
        }
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
        description: error.message || "Failed to create project. Please try again.",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProject: createProjectFlow,
    isLoading
  };
};
