
import { Button } from "@/components/ui/button";
import { Milestone } from "./types";

export interface MilestoneControlsProps {
  milestone: Milestone;
  onMarkComplete: (id: string) => void;
  onUndoCompletion: (id: string) => void;
}

export function MilestoneControls({
  milestone,
  onMarkComplete,
  onUndoCompletion
}: MilestoneControlsProps) {
  if (milestone.status === 'completed') {
    return (
      <Button
        onClick={() => onUndoCompletion(milestone.id)}
        variant="outline"
        size="sm"
      >
        Undo
      </Button>
    );
  }

  return (
    <Button
      onClick={() => onMarkComplete(milestone.id)}
      variant="outline"
      size="sm"
    >
      Mark as Complete
    </Button>
  );
}
