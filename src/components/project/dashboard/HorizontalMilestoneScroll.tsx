
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRef } from "react";
import { Milestone } from "@/types/project-types";

interface HorizontalMilestoneScrollProps {
  milestones: Milestone[];
}

export function HorizontalMilestoneScroll({ milestones }: HorizontalMilestoneScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[#00C851]';
      case 'in_progress':
        return 'bg-[#ff6b24]';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('left')}
          className="h-8 w-8 rounded-full bg-white shadow-md"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto py-4 px-8 scroll-smooth hide-scrollbar"
      >
        {milestones.map((milestone, index) => (
          <Card 
            key={milestone.id}
            className="flex-none w-[250px] hover:shadow-lg transition-shadow"
          >
            <div className={`h-2 ${getStatusColor(milestone.status || '')}`} />
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-[#172b70]">{milestone.name}</h3>
                <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>
                  {milestone.status || 'pending'}
                </Badge>
              </div>
              {milestone.amount && (
                <p className="text-xl font-bold">${milestone.amount.toLocaleString()}</p>
              )}
              {milestone.description && (
                <p className="text-sm text-gray-500">{milestone.description}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('right')}
          className="h-8 w-8 rounded-full bg-white shadow-md"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
