
import { Button } from "@/components/ui/button";
import { Undo } from "lucide-react";
import { UndoCompletionDialog } from "./UndoCompletionDialog";
import { Milestone } from "./types";

interface MilestoneControlsProps {
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
      <UndoCompletionDialog
        milestoneId={milestone.id}
        onConfirm={onUndoCompletion}
      />
    );
  }

  return (
    <Button
      onClick={() => onMarkComplete(milestone.id)}
      variant="outline"
    >
      Mark as Complete
    </Button>
  );
}
