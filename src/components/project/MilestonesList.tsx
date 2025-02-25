import React from 'react';
import { MilestoneCard } from './milestone/MilestoneCard';
import { useMilestoneCompletion } from './milestone/hooks/useMilestoneCompletion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MilestonesListProps {
  projectId: string; // Add projectId to props interface
}

export function MilestonesList({ projectId }: MilestonesListProps) {
  const { completeMilestone, undoMilestone } = useMilestoneCompletion();

  const { data: milestones, isLoading, error } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching milestones:', error);
        throw error;
      }

      return data;
    },
  });

  if (isLoading) {
    return <div>Loading milestones...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const handleCompletion = async (milestoneId: string) => {
    await completeMilestone(milestoneId);
  };

  const handleUndo = async (milestoneId: string) => {
    await undoMilestone(milestoneId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {milestones?.map((milestone) => (
        <MilestoneCard
          key={milestone.id}
          milestone={milestone}
          onComplete={handleCompletion}
          onUndo={handleUndo}
        />
      ))}
    </div>
  );
}
