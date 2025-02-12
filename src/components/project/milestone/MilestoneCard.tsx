
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MilestoneStatusBadge } from "./MilestoneStatus";
import { UndoCompletionDialog } from "./UndoCompletionDialog";
import { Milestone } from "./types";

interface MilestoneCardProps {
  milestone: Milestone;
  onMarkComplete: (id: string) => void;
  onUndoCompletion: (id: string) => void;
  hideControls: boolean;
  isHomeowner: boolean;
  isContractor: boolean;
}

export function MilestoneCard({
  milestone,
  onMarkComplete,
  onUndoCompletion,
  hideControls,
  isHomeowner,
  isContractor,
}: MilestoneCardProps) {
  return (
    <Card>
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
            <MilestoneStatusBadge status={milestone.status} />
            {!hideControls && !isHomeowner && (
              <div className="flex gap-2">
                {milestone.status !== 'completed' && (
                  <Button
                    onClick={() => onMarkComplete(milestone.id)}
                    variant="outline"
                  >
                    Mark as Complete
                  </Button>
                )}
                {isContractor && milestone.status === 'completed' && (
                  <UndoCompletionDialog
                    onUndo={() => onUndoCompletion(milestone.id)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
