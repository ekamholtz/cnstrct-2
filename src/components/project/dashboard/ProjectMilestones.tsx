
import { HorizontalMilestoneScroll } from "./HorizontalMilestoneScroll";
import { Milestone } from "@/types/project-types";

interface ProjectMilestonesProps {
  milestones: Milestone[];
}

export function ProjectMilestones({ milestones }: ProjectMilestonesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#172b70]">Project Milestones</h2>
      <HorizontalMilestoneScroll milestones={milestones} />
    </div>
  );
}
