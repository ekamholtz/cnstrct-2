
import { ChevronLeft, ChevronRight, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRef } from "react";
import { Milestone, SimplifiedMilestone } from "@/types/project-types";
import { format } from "date-fns";
import { useMilestoneCompletion } from "@/components/project/milestone/hooks/useMilestoneCompletion";

interface HorizontalMilestoneScrollProps {
  milestones: Milestone[] | SimplifiedMilestone[];
}

export function HorizontalMilestoneScroll({ milestones }: HorizontalMilestoneScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { completeMilestone, undoMilestone } = useMilestoneCompletion();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'bg-[#19db93]';
      case 'in_progress':
        return 'bg-[#ff6b24]';
      default:
        return 'bg-gray-200';
    }
  };

  const getStatusBadgeStyle = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMilestoneAction = (milestone: Milestone | SimplifiedMilestone) => {
    if (milestone.status === 'completed') {
      undoMilestone(milestone.id);
    } else {
      completeMilestone(milestone.id);
    }
  };

  const getButtonStyle = (status: string | null) => {
    if (status === 'completed') {
      // Orange button with darker text for better contrast
      return "bg-[#ff6b24] hover:bg-[#ff6b24]/90 text-[#222222] font-bold";
    }
    // Green button with darker text for better contrast
    return "bg-[#19db93] hover:bg-[#19db93]/90 text-[#222222] font-bold";
  };

  // Function to safely format date for both Milestone and SimplifiedMilestone
  const formatDate = (milestone: Milestone | SimplifiedMilestone) => {
    if ('updated_at' in milestone) {
      return format(new Date(milestone.updated_at), 'MMM d, yyyy');
    }
    return format(new Date(), 'MMM d, yyyy'); // Fallback for SimplifiedMilestone
  };

  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('left')}
          className="h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto py-4 px-8 scroll-smooth hide-scrollbar"
      >
        {milestones.map((milestone) => (
          <Card 
            key={milestone.id}
            className="flex-none w-[280px] aspect-square hover:shadow-lg transition-shadow border-0"
          >
            <div className={`h-2 ${getStatusColor(milestone.status)}`} />
            <div className="p-4 flex flex-col h-[calc(100%-8px)]">
              <div className="space-y-3 flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-[#172b70] line-clamp-2">{milestone.name}</h3>
                  <Badge className={getStatusBadgeStyle(milestone.status)}>
                    {milestone.status?.replace('_', ' ') || 'pending'}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-[#172b70]">
                  ${milestone.amount?.toLocaleString()}
                </p>
                {'description' in milestone && milestone.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{milestone.description}</p>
                )}
              </div>
              <div className="pt-4 mt-auto border-t border-gray-100 space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {formatDate(milestone)}
                  </span>
                </div>
                <Button
                  size="sm"
                  className={`w-full ${getButtonStyle(milestone.status)} border-0`}
                  onClick={() => handleMilestoneAction(milestone)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {milestone.status === 'completed' ? 'Undo Completion' : 'Mark as Completed'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('right')}
          className="h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
