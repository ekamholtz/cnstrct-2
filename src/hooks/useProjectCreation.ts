
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ProjectFormValues } from "@/components/projects/types";

export const useProjectCreation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createProject = async (projectData: ProjectFormValues) => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get user's profile to determine role and gc_account_id
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, gc_account_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      console.log('Creating project with user profile:', userProfile);

      // First, create the client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: projectData.clientName,
          address: projectData.clientAddress,
          email: projectData.clientEmail,
          phone_number: projectData.clientPhone
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Initialize project data
      let projectInsert: any = {
        name: projectData.projectName,
        address: projectData.clientAddress,
        status: 'active' as const,
        client_id: client.id
      };
      
      // Set pm_user_id and contractor_id based on user role
      if (userProfile.role === 'gc_admin') {
        // If user is a GC admin, they are both the contractor and PM
        projectInsert.contractor_id = user.id;
        projectInsert.pm_user_id = user.id;
        
        console.log('GC admin creating project - setting contractor_id and pm_user_id to self:', user.id);
      } 
      else if (userProfile.role === 'project_manager') {
        // For PMs, we need to find their associated GC admin
        if (!userProfile.gc_account_id) {
          throw new Error('Project Manager is not associated with a GC account');
        }
        
        // Find the GC admin linked to this gc_account_id
        const { data: gcAdmins, error: gcError } = await supabase
          .from('profiles')
          .select('id')
          .eq('gc_account_id', userProfile.gc_account_id)
          .eq('role', 'gc_admin')
          .eq('is_owner', true);
          
        if (gcError) {
          console.error('Error finding GC admin:', gcError);
          throw new Error('Could not find associated General Contractor');
        }
        
        // Check if we have at least one GC admin
        if (!gcAdmins || gcAdmins.length === 0) {
          // Try again without the is_owner filter as a fallback
          const { data: fallbackGcAdmins, error: fallbackError } = await supabase
            .from('profiles')
            .select('id')
            .eq('gc_account_id', userProfile.gc_account_id)
            .eq('role', 'gc_admin');
            
          if (fallbackError || !fallbackGcAdmins || fallbackGcAdmins.length === 0) {
            console.error('No GC admin found for gc_account_id:', userProfile.gc_account_id);
            throw new Error('No General Contractor admin found for this account');
          }
          
          // Set contractor_id to the first GC admin's id
          projectInsert.contractor_id = fallbackGcAdmins[0].id;
        } else {
          // Set contractor_id to the owner GC admin's id
          projectInsert.contractor_id = gcAdmins[0].id;
        }
        
        // Set pm_user_id to the current PM user's id
        projectInsert.pm_user_id = user.id;
        
        console.log('PM creating project:', {
          contractor_id: projectInsert.contractor_id,
          pm_user_id: projectInsert.pm_user_id,
          gc_account_id: userProfile.gc_account_id
        });
      }
      else {
        throw new Error('Only GC Admins and Project Managers can create projects');
      }

      // Create project with the constructed data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectInsert)
        .select()
        .single();

      if (projectError) throw projectError;

      // Create milestones
      if (projectData.milestones?.length > 0) {
        const milestonesData = projectData.milestones.map((milestone) => ({
          name: milestone.name,
          amount: parseFloat(milestone.amount),
          description: milestone.description,
          project_id: project.id,
          status: 'pending' as const
        }));

        // Fix: Don't use select at all and be extremely explicit with column names during insert
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
