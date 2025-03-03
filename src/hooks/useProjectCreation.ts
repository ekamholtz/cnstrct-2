
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
        .select('role, gc_account_id, is_owner')
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
        
        console.log('PM creating project - searching for GC admin with gc_account_id:', userProfile.gc_account_id);

        // First, check if the GC account exists and has a valid creator_id
        const { data: gcAccount, error: gcAccountError } = await supabase
          .from('gc_accounts')
          .select('id, creator_id')
          .eq('id', userProfile.gc_account_id)
          .single();
          
        if (gcAccountError) {
          console.error('Error finding GC account:', gcAccountError);
          throw new Error('Could not find associated General Contractor account');
        }
        
        if (gcAccount.creator_id) {
          console.log('Found GC account creator:', gcAccount.creator_id);
          projectInsert.contractor_id = gcAccount.creator_id;
        } else {
          // If no creator_id found, fallback to looking for owner GC admin
          const { data: ownerGcAdmins, error: ownerGcError } = await supabase
            .from('profiles')
            .select('id')
            .eq('gc_account_id', userProfile.gc_account_id)
            .eq('role', 'gc_admin')
            .eq('is_owner', true);
            
          if (ownerGcError) {
            console.error('Error finding owner GC admin:', ownerGcError);
          }
          
          // Check if we found an owner GC admin
          if (ownerGcAdmins && ownerGcAdmins.length > 0) {
            console.log('Found owner GC admin:', ownerGcAdmins[0].id);
            projectInsert.contractor_id = ownerGcAdmins[0].id;
            
            // Update gc_account's creator_id for future use
            await supabase
              .from('gc_accounts')
              .update({ creator_id: ownerGcAdmins[0].id })
              .eq('id', userProfile.gc_account_id);
          } else {
            console.log('No owner GC admin found, looking for any GC admin');
            
            // If no owner found, try to find any GC admin
            const { data: anyGcAdmins, error: anyGcError } = await supabase
              .from('profiles')
              .select('id')
              .eq('gc_account_id', userProfile.gc_account_id)
              .eq('role', 'gc_admin');
              
            if (anyGcError) {
              console.error('Error finding any GC admin:', anyGcError);
              throw new Error('Could not find any General Contractor admin');
            }
            
            if (!anyGcAdmins || anyGcAdmins.length === 0) {
              console.error('No GC admin found for gc_account_id:', userProfile.gc_account_id);
              
              // If there's no GC admin, set the contractor_id to the PM themselves as a fallback
              console.log('No GC admin found, setting contractor_id to the PM user as fallback:', user.id);
              projectInsert.contractor_id = user.id;
            } else {
              console.log('Found GC admin (non-owner):', anyGcAdmins[0].id);
              projectInsert.contractor_id = anyGcAdmins[0].id;
              
              // Update gc_account's creator_id for future use
              await supabase
                .from('gc_accounts')
                .update({ creator_id: anyGcAdmins[0].id })
                .eq('id', userProfile.gc_account_id);
            }
          }
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
