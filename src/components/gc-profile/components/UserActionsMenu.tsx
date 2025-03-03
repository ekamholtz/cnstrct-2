
import { UserCog, Crown, UserMinus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GCUserProfile } from "../types";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import { useTeamManagement } from "../hooks/useTeamManagement";

interface UserActionsMenuProps {
  user: GCUserProfile;
}

export const UserActionsMenu = ({ user }: UserActionsMenuProps) => {
  const { currentUserProfile, isOwner } = useCurrentUserProfile();
  const { transferOwnership, removeTeamMember } = useTeamManagement();
  
  // Prevent actions on self
  const isSelf = currentUserProfile?.id === user.id;
  
  // Only owner can transfer ownership or remove team members
  const canTransferOwnership = isOwner && user.role === 'gc_admin' && !isSelf && !user.is_owner;
  const canRemoveMember = isOwner && !isSelf && !user.is_owner;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <UserCog className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          Reset Password
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          Edit User
        </DropdownMenuItem>
        
        {canTransferOwnership && (
          <>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Crown className="h-4 w-4 mr-2" />
                  Make Company Owner
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Transfer Company Ownership</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to make {user.full_name} the owner of this company? 
                    You will lose owner privileges.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => transferOwnership(user.id)}>
                    Transfer Ownership
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        
        {canRemoveMember && (
          <>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  className="text-red-600 hover:text-red-700"
                  onSelect={(e) => e.preventDefault()}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove from Company
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {user.full_name} from your company?
                    This will revoke their access to all company projects.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => removeTeamMember(user.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove User
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-gray-500"
          onClick={() => {
            console.log(`User ID: ${user.id}`);
            console.log(`User full name: ${user.full_name}`);
            console.log(`User email: ${user.email}`);
            console.log(`User role: ${user.role}`);
            console.log(`User GC account ID: ${user.gc_account_id}`);
            console.log(`User is owner: ${user.is_owner}`);
            console.log(`User profile completed: ${user.has_completed_profile}`);
            console.log(`User created at: ${user.created_at}`);
          }}
        >
          Debug User Info
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
