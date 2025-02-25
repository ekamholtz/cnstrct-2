
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo } from "lucide-react";
import { MilestoneControls } from "./MilestoneControls";
import { MilestoneStatus } from "./MilestoneStatus";
import { Milestone } from "./types";

export interface MilestoneCardProps {
  milestone: Milestone;
  isContractor?: boolean;
  onMarkComplete: (id: string) => void;
  onUndoCompletion: (id: string) => void;
  hideControls?: boolean;
}

export function MilestoneCard({
  milestone,
  isContractor = false,
  onMarkComplete,
  onUndoCompletion,
  hideControls = false
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
            <MilestoneStatus status={milestone.status} />
            {!hideControls && isContractor && (
              <MilestoneControls
                milestone={milestone}
                onComplete={() => onMarkComplete(milestone.id)}
                onUndo={() => onUndoCompletion(milestone.id)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
