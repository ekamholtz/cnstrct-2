
import { Button } from "@/components/ui/button";
import { Undo } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Milestone, MilestoneStatus } from "@/components/projects/types";

interface MilestoneControlsProps {
  milestone: Milestone;
  isContractor: boolean;
  onMarkComplete: (id: string) => void;
  onUndoCompletion: (id: string) => void;
}

export function MilestoneControls({ 
  milestone, 
  isContractor, 
  onMarkComplete, 
  onUndoCompletion 
}: MilestoneControlsProps) {
  if (!isContractor) return null;

  return (
    <div className="flex gap-2">
      {milestone.status !== 'completed' && (
        <Button
          onClick={() => onMarkComplete(milestone.id)}
          variant="outline"
        >
          Mark as Complete
        </Button>
      )}
      {milestone.status === 'completed' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="text-orange-600 hover:text-orange-700"
            >
              <Undo className="h-4 w-4 mr-2" />
              Undo Completion
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Undo Milestone Completion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to undo the completion of this milestone? 
                This will delete any associated invoice and revert the milestone 
                status to pending.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onUndoCompletion(milestone.id)}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
