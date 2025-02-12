
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { MilestoneCard } from "./MilestoneCard";
import { Milestone } from "./types";

interface MilestonesListProps {
  milestones: Milestone[];
  onMarkComplete: (id: string) => void;
  hideControls?: boolean;
}

export function MilestonesList({ milestones, onMarkComplete, hideControls = false }: MilestonesListProps) {
  const { toast } = useToast();

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

  const handleUndoCompletion = async (milestoneId: string) => {
    try {
      // First check if there's a paid invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('status')
        .eq('milestone_id', milestoneId)
        .maybeSingle();

      if (invoiceError) throw invoiceError;

      if (invoice?.status === 'paid') {
        toast({
          variant: "destructive",
          title: "Cannot Undo Completion",
          description: "This milestone cannot be reverted because its invoice has already been paid.",
        });
        return;
      }

      // If no paid invoice, proceed with undo
      const { data, error } = await supabase.rpc('undo_milestone_completion', {
        milestone_id_param: milestoneId
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Milestone has been reverted to pending status",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to undo milestone completion. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error undoing milestone completion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to undo milestone completion. Please try again.",
      });
    }
  };

  const isHomeowner = userRole === 'homeowner';
  const isContractor = userRole === 'general_contractor';

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Milestones</h2>
      <div className="space-y-4">
        {milestones && milestones.length > 0 ? (
          milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onMarkComplete={onMarkComplete}
              onUndoCompletion={handleUndoCompletion}
              hideControls={hideControls}
              isHomeowner={isHomeowner}
              isContractor={isContractor}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-600">
              No milestones found for this project.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
