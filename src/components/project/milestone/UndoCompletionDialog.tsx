
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
import { Button } from "@/components/ui/button";
import { Undo } from "lucide-react";

interface UndoCompletionDialogProps {
  onUndo: () => void;
}

export function UndoCompletionDialog({ onUndo }: UndoCompletionDialogProps) {
  return (
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
          <AlertDialogAction onClick={onUndo}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
