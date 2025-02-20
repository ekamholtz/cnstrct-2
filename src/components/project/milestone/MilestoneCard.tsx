
import { Card, CardContent } from "@/components/ui/card";
import { Milestone } from "@/components/projects/types";
import { MilestoneStatusBadge } from "./MilestoneStatus";
import { MilestoneControls } from "./MilestoneControls";

interface MilestoneCardProps {
  milestone: Milestone;
  isContractor: boolean;
  onMarkComplete: (id: string) => void;
  onUndoCompletion: (id: string) => void;
}

export function MilestoneCard({
  milestone,
  isContractor,
  onMarkComplete,
  onUndoCompletion
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
            <p className="text-sm font-medium text-gray-900">
              ${milestone.amount.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <MilestoneStatusBadge status={milestone.status} />
            <MilestoneControls
              milestone={milestone}
              isContractor={isContractor}
              onMarkComplete={onMarkComplete}
              onUndoCompletion={onUndoCompletion}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
