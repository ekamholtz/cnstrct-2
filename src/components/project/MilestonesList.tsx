
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MilestoneCard } from './milestone/MilestoneCard';
import { useMilestoneCompletion } from './milestone/hooks/useMilestoneCompletion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MilestonesListProps {
  projectId: string;
}

export function MilestonesList({ projectId }: MilestonesListProps) {
  const { completeMilestone, undoMilestone } = useMilestoneCompletion();
  
  const { data: milestones, isLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

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

  const isGeneralContractor = userRole === 'gc_admin';

  if (isLoading) {
    return <div>Loading milestones...</div>;
  }

  return (
    <div className="space-y-4">
      {milestones && milestones.length > 0 ? (
        milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            isContractor={isGeneralContractor}
            onMarkComplete={completeMilestone}
            onUndoCompletion={undoMilestone}
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
  );
}
