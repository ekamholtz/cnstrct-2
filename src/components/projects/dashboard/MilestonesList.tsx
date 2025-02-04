import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  amount: number | null;
  status: 'pending' | 'completed';
  created_at: string;
}

interface MilestonesListProps {
  milestones: Milestone[] | undefined;
  onMilestoneComplete: () => void;
}

export function MilestonesList({ milestones, onMilestoneComplete }: MilestonesListProps) {
  const { toast } = useToast();

  useEffect(() => {
    const updateMilestoneStatuses = async () => {
      if (!milestones?.length) return;

      // Sort milestones by created_at to ensure consistent ordering
      const sortedMilestones = [...milestones].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Find the first non-completed milestone
      const firstPendingIndex = sortedMilestones.findIndex(m => m.status === 'pending');

      // If all milestones are completed or no pending milestones found, no updates needed
      if (firstPendingIndex === -1) return;

      console.log("First pending milestone:", sortedMilestones[firstPendingIndex]);
    };

    updateMilestoneStatuses();
  }, [milestones]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMarkComplete = async (milestoneId: string) => {
    try {
      console.log("Marking milestone complete:", milestoneId);
      const { error } = await supabase
        .from('milestones')
        .update({ status: 'completed' })
        .eq('id', milestoneId);

      if (error) throw error;

      toast({
        title: "Milestone Updated",
        description: "The milestone has been marked as complete.",
      });

      onMilestoneComplete();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update milestone status.",
      });
    }
  };

  // Sort milestones by created_at before rendering
  const sortedMilestones = milestones?.slice().sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (!sortedMilestones?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-600">
          No milestones found for this project.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMilestones.map((milestone) => (
        <Card key={milestone.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                {milestone.description && (
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                )}
                {milestone.amount && (
                  <p className="text-sm font-medium text-gray-900">
                    ${milestone.amount.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(milestone.status)}`}>
                  {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                </span>
                {milestone.status !== 'completed' && (
                  <Button
                    onClick={() => handleMarkComplete(milestone.id)}
                    variant="outline"
                  >
                    Mark as Complete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}