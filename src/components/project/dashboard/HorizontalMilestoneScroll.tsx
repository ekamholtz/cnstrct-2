import { ChevronLeft, ChevronRight, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRef, useEffect, useState } from "react";
import { Milestone, SimplifiedMilestone } from "@/types/project-types";
import { format } from "date-fns";
import { useMilestoneCompletion } from "@/components/project/milestone/hooks/useMilestoneCompletion";
import { supabase } from "@/integrations/supabase/client";

interface HorizontalMilestoneScrollProps {
  milestones: Milestone[] | SimplifiedMilestone[];
  userRole?: string | null;
}

export function HorizontalMilestoneScroll({ milestones, userRole }: HorizontalMilestoneScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { completeMilestone, undoMilestone } = useMilestoneCompletion();
  const [isUserClient, setIsUserClient] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  
  // Check user information when component mounts
  useEffect(() => {
    const checkUserInfo = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const email = data.user?.email || null;
        setCurrentUserEmail(email);
        
        // Specific check for tc1@email.com - ALWAYS treat as client
        if (email === 'tc1@email.com') {
          console.log('tc1@email.com detected - forcing client role');
          setIsUserClient(true);
          return;
        }
        
        // Standard role check
        if (userRole === 'homeowner' || userRole === 'client' || 
            String(userRole).toLowerCase().includes('homeowner') || 
            String(userRole).toLowerCase().includes('client')) {
          setIsUserClient(true);
        }
      } catch (error) {
        console.error('Error checking user info:', error);
      }
    };
    
    checkUserInfo();
  }, [userRole]);

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
    // Block action for clients and tc1@email.com
    if (isUserClient || currentUserEmail === 'tc1@email.com') {
      console.log('Client users cannot modify milestones');
      return;
    }
    
    if (milestone.status === 'completed') {
      undoMilestone(milestone.id);
    } else {
      completeMilestone(milestone.id);
    }
  };

  const getButtonStyle = (status: string | null) => {
    if (status === 'completed') {
      return "bg-[#ff6b24] hover:bg-[#ff6b24]/90 text-[#222222] font-bold";
    }
    return "bg-[#19db93] hover:bg-[#19db93]/90 text-[#222222] font-bold";
  };

  const formatDate = (milestone: Milestone | SimplifiedMilestone) => {
    if ('updated_at' in milestone) {
      return format(new Date(milestone.updated_at), 'MMM d, yyyy');
    }
    return format(new Date(), 'MMM d, yyyy');
  };

  // Determine if buttons should be shown (not a client and not tc1@email.com)
  const shouldShowButtons = !isUserClient && currentUserEmail !== 'tc1@email.com';

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
            className="flex-none w-[280px] aspect-square hover:shadow-lg transition-shadow"
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
              <div className="pt-4 mt-auto border-t space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {formatDate(milestone)}
                  </span>
                </div>
                {shouldShowButtons && (
                  <Button
                    size="sm"
                    className={`w-full ${getButtonStyle(milestone.status)}`}
                    onClick={() => handleMilestoneAction(milestone)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {milestone.status === 'completed' ? 'Undo Completion' : 'Mark as Completed'}
                  </Button>
                )}
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
