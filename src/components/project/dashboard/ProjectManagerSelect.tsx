
import { useState } from "react";
import { UserRound, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUpdateProjectPM } from "@/hooks/useUpdateProjectPM";
import { ClientProject } from "@/types/project-types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { makeMutationCompatible } from "@/utils/queryCompatibility";
import { GCUserProfile } from "@/components/gc-profile/types";

interface ProjectManagerSelectProps {
  project: ClientProject;
  isGCAdmin: boolean;
}

export function ProjectManagerSelect({ project, isGCAdmin }: ProjectManagerSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedPM, setSelectedPM] = useState<string | null>(project.pm_user_id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const { teamMembers, isLoadingTeam } = useTeamMembers();
  
  // Use the compatibility helper to ensure isLoading is available
  const updateProjectPMMutation = useUpdateProjectPM();
  const updateProjectPM = makeMutationCompatible(updateProjectPMMutation);
  
  // Find the current PM in the team members list
  const currentPM = teamMembers?.find(member => member.id === project.pm_user_id);
  
  const handleSelectPM = (userId: string) => {
    setSelectedPM(userId === "none" ? null : userId);
  };
  
  const handleConfirmPM = async () => {
    try {
      await updateProjectPM.mutateAsync({
        projectId: project.id,
        pmUserId: selectedPM,
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to update project manager:", error);
    }
  };

  // Filter team members based on search query
  const filteredTeamMembers = teamMembers?.filter(member => {
    if (!searchQuery) return true;
    return member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (member as GCUserProfile).email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Use isPending for loading state (compatible with both old and new React Query versions)
  // Check both isLoading and isPending properties for compatibility
  const isUpdating = updateProjectPM.isPending || updateProjectPM.isLoading;
  
  if (isLoadingTeam || isUpdating) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-gray-500">Project Manager:</div>
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm font-medium text-gray-500">Project Manager:</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <UserRound className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium">
            {currentPM?.full_name || "Not assigned"}
          </span>
        </div>
        
        {isGCAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <UserCog className="h-4 w-4" />
                Reassign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reassign Project Manager</DialogTitle>
                <DialogDescription>
                  Select a team member to assign as the project manager for {project.name}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="mb-4">
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto pr-1">
                  <RadioGroup value={selectedPM || "none"} onValueChange={handleSelectPM}>
                    <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none" className="flex-1 cursor-pointer">
                        No Project Manager
                      </Label>
                    </div>
                    
                    {filteredTeamMembers?.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No team members found
                      </div>
                    ) : (
                      filteredTeamMembers?.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100"
                        >
                          <RadioGroupItem value={member.id} id={member.id} />
                          <Label htmlFor={member.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <div>{member.full_name}</div>
                                <div className="text-xs text-gray-500">{(member as GCUserProfile).email || ''}</div>
                              </div>
                              {member.role === 'gc_admin' && (
                                <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))
                    )}
                  </RadioGroup>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmPM} 
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
