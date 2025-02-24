
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { MilestoneControls } from "./MilestoneControls";
import { MilestoneStatus } from "./MilestoneStatus";
import { Milestone } from "./types";

interface MilestoneCardProps {
  milestone: Milestone;
  isContractor: boolean;
  onMarkComplete: (id: string) => void;
  onUndoCompletion: (id: string) => void;
  hideControls?: boolean;
}

export function MilestoneCard({
  milestone,
  isContractor,
  onMarkComplete,
  onUndoCompletion,
  hideControls = false
}: MilestoneCardProps) {
  return (
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
            <MilestoneStatus status={milestone.status} />
            {!hideControls && isContractor && (
              <MilestoneControls
                milestone={milestone}
                onMarkComplete={onMarkComplete}
                onUndoCompletion={onUndoCompletion}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
