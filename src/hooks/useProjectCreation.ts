import { supabase } from "@/integrations/supabase/client";
import { ProjectFormValues } from "@/components/projects/types";
import { useToast } from "@/components/ui/use-toast";

export const useProjectCreation = (onSuccess?: () => void) => {
  const { toast } = useToast();

  const createProject = async (data: ProjectFormValues) => {
    try {
      // Get the current user's profile ID which we'll use as contractor_id
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("No authenticated user found");
      }

      console.log("Creating project for contractor:", session.user.id);

      // Check if client exists or create new client
      const { data: existingClient, error: clientLookupError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", data.clientEmail)
        .maybeSingle();

      if (clientLookupError) {
        console.error("Error looking up client:", clientLookupError);
        throw clientLookupError;
      }

      let clientId;
      if (!existingClient) {
        // Create new client
        const { data: newClient, error: createClientError } = await supabase
          .from("clients")
          .insert({
            name: data.clientName,
            email: data.clientEmail,
            address: data.clientAddress,
            phone_number: data.clientPhone || null,
          })
          .select()
          .single();

        if (createClientError) {
          console.error("Error creating client:", createClientError);
          throw createClientError;
        }
        clientId = newClient.id;
        console.log("Created new client:", newClient);
      } else {
        clientId = existingClient.id;
        console.log("Using existing client:", existingClient);
      }

      // Create project with client reference
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: data.projectName,
          address: data.clientAddress,
          status: "active",
          contractor_id: session.user.id,
          client_id: clientId
        })
        .select()
        .single();

      if (projectError) {
        console.error("Error creating project:", projectError);
        throw projectError;
      }

      console.log("Project created:", project);

      // Create milestones
      const milestonesData = data.milestones.map(milestone => ({
        project_id: project.id,
        name: milestone.name,
        description: milestone.description,
        amount: Number(milestone.amount),
        status: "pending" as const
      }));

      const { error: milestonesError } = await supabase
        .from("milestones")
        .insert(milestonesData);

      if (milestonesError) {
        console.error("Error creating milestones:", milestonesError);
        throw milestonesError;
      }

      console.log("Milestones created for project:", project.id);

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      onSuccess?.();
      return true;
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      });
      return false;
    }
  };

  return { createProject };
};