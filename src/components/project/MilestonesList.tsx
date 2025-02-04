import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  amount: number | null;
  status: 'pending' | 'in_progress' | 'completed';
}

interface MilestonesListProps {
  milestones: Milestone[];
  onMarkComplete: (id: string) => void;
}

export function MilestonesList({ milestones, onMarkComplete }: MilestonesListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Milestones</h2>
      <div className="space-y-4">
        {milestones && milestones.length > 0 ? (
          milestones.map((milestone) => (
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
                    <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(milestone.status)}`}>
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </span>
                    {milestone.status !== 'completed' && (
                      <Button
                        onClick={() => onMarkComplete(milestone.id)}
                        variant="outline"
                      >
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-600">
              No milestones found for this project.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}