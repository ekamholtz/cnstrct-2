
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
        .select('role, gc_account_id, is_owner, full_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      console.log('Creating project with user profile:', userProfile);

      // Validate that user has a gc_account_id
      if (!userProfile.gc_account_id) {
        throw new Error('You must be associated with a General Contractor company to create projects');
      }

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

      // Get the contractor_id (GC Admin) for this gc_account
      let contractor_id: string | null = null;
      
      // If user is a GC admin, they are the contractor
      if (userProfile.role === 'gc_admin') {
        contractor_id = user.id;
        console.log('GC admin creating project - setting contractor_id to self:', user.id);
      } else {
        // For PMs, find the associated GC admin (owner or creator)
        console.log('PM creating project - finding GC admin for gc_account_id:', userProfile.gc_account_id);
        
        // First check for the account creator/owner
        const { data: gcAccount, error: gcAccountError } = await supabase
          .from('gc_accounts')
          .select('creator_id')
          .eq('id', userProfile.gc_account_id)
          .single();
          
        if (gcAccountError) {
          console.error('Error finding GC account:', gcAccountError);
          throw new Error('Could not find associated General Contractor account');
        }
        
        if (gcAccount.creator_id) {
          contractor_id = gcAccount.creator_id;
          console.log('Using gc_account creator_id as contractor_id:', contractor_id);
        } else {
          // If no creator_id, find a GC admin in this company, preferring owner
          const { data: gcAdmins, error: gcAdminsError } = await supabase
            .from('profiles')
            .select('id, is_owner')
            .eq('gc_account_id', userProfile.gc_account_id)
            .eq('role', 'gc_admin')
            .order('is_owner', { ascending: false });
            
          if (gcAdminsError) {
            console.error('Error finding GC admins:', gcAdminsError);
            throw new Error('Could not find any General Contractor admin');
          }
          
          if (gcAdmins && gcAdmins.length > 0) {
            contractor_id = gcAdmins[0].id;
            console.log('Found GC admin to use as contractor_id:', contractor_id);
            
            // Update gc_account's creator_id for future use
            await supabase
              .from('gc_accounts')
              .update({ creator_id: contractor_id })
              .eq('id', userProfile.gc_account_id);
          } else {
            throw new Error('Could not find any General Contractor admin for this company');
          }
        }
      }
      
      if (!contractor_id) {
        throw new Error('Failed to determine contractor_id for the project');
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectData.projectName,
          address: projectData.clientAddress,
          status: 'active',
          client_id: client.id,
          contractor_id: contractor_id,
          pm_user_id: userProfile.role === 'project_manager' ? user.id : null
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // If user is a PM, also add them to the project_managers table
      if (userProfile.role === 'project_manager') {
        const { error: pmError } = await supabase
          .from('project_managers')
          .insert({
            project_id: project.id,
            user_id: user.id
          });
          
        if (pmError) {
          console.error('Error adding PM to project_managers:', pmError);
          // Non-fatal error, continue with project creation
        }
      }

      // Create milestones - FIX: Change the way we insert and select to avoid ambiguity
      if (projectData.milestones?.length > 0) {
        const milestonesData = projectData.milestones.map((milestone) => ({
          name: milestone.name,
          amount: parseFloat(milestone.amount),
          description: milestone.description,
          project_id: project.id,
          status: 'pending' as const
        }));

        // Use a two-step approach to avoid the ambiguous column reference
        // Step 1: Insert milestones without returning data
        const { error: milestonesInsertError } = await supabase
          .from('milestones')
          .insert(milestonesData);

        if (milestonesInsertError) {
          console.error('Error creating milestones:', milestonesInsertError);
          throw milestonesInsertError;
        }

        // Step 2: Separately fetch the milestones to verify creation
        const { data: createdMilestones, error: milestonesSelectError } = await supabase
          .from('milestones')
          .select('id')
          .eq('project_id', project.id);

        if (milestonesSelectError) {
          console.error('Error verifying milestone creation:', milestonesSelectError);
          // Not throwing here since the milestones were likely created
        } else {
          console.log(`Successfully created ${createdMilestones.length} milestones`);
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
    createProject,
    isLoading
  };
};
