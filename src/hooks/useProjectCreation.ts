
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ProjectFormValues } from "@/components/projects/types";
import { MilestoneStatus } from "@/types/project-types";

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

      // Handle milestones creation
      if (projectData.milestones?.length > 0) {
        try {
          // Prepare milestones data - ensuring the status is properly typed
          const milestonesData = projectData.milestones.map((milestone) => ({
            name: milestone.name,
            amount: parseFloat(milestone.amount),
            description: milestone.description,
            project_id: project.id,
            status: 'pending' as MilestoneStatus
          }));

          // Try the standard insert first
          try {
            const { error: milestonesError } = await supabase
              .from('milestones')
              .insert(milestonesData);
              
            if (milestonesError) {
              throw milestonesError;
            }
            
            console.log(`Successfully created milestones for project: ${project.id}`);
          } catch (insertError) {
            console.error('Error inserting milestones with standard method:', insertError);
            
            // Fallback to our custom function if normal insert fails
            const { error: rpcError } = await supabase.rpc(
              'insert_milestones',
              { milestones_data: JSON.stringify(milestonesData) }
            );
            
            if (rpcError) {
              console.error('Error with RPC milestone insertion:', rpcError);
              throw rpcError;
            } else {
              console.log(`Successfully created milestones for project: ${project.id} using RPC function`);
            }
          }
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
    createProject,
    isLoading
  };
};
