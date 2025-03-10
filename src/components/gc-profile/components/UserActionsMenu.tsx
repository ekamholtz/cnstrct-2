import { UserCog, Crown, UserMinus, Shield, KeyRound, Edit } from "lucide-react";
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
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-cnstrct-navy hover:bg-gray-50">
          <UserCog className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 shadow-premium border border-gray-200/60">
        <DropdownMenuItem className="cursor-pointer flex items-center">
          <KeyRound className="h-4 w-4 mr-2 text-gray-500" />
          <span>Reset Password</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer flex items-center">
          <Edit className="h-4 w-4 mr-2 text-gray-500" />
          <span>Edit User</span>
        </DropdownMenuItem>
        
        {canTransferOwnership && (
          <>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  className="cursor-pointer flex items-center text-amber-600" 
                  onSelect={(e) => e.preventDefault()}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  <span>Make Company Owner</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="shadow-premium border border-gray-200/60">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-cnstrct-navy">Transfer Company Ownership</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to make <span className="font-medium">{user.full_name}</span> the owner of this company? 
                    You will lose owner privileges.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border border-gray-200">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => transferOwnership(user.id)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
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
                  className="cursor-pointer flex items-center text-red-600 hover:text-red-700"
                  onSelect={(e) => e.preventDefault()}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  <span>Remove from Company</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="shadow-premium border border-gray-200/60">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-cnstrct-navy">Remove Team Member</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove <span className="font-medium">{user.full_name}</span> from your company?
                    This will revoke their access to all company projects.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border border-gray-200">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => removeTeamMember(user.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Remove User
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        
        {process.env.NODE_ENV === 'development' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer flex items-center text-gray-500"
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
              <Shield className="h-4 w-4 mr-2" />
              <span>Debug User Info</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
