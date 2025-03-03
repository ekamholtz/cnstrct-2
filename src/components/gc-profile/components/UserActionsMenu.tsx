
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GCUserProfile } from "../types";

interface UserActionsMenuProps {
  user: GCUserProfile;
}

export const UserActionsMenu = ({ user }: UserActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <UserCog className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Reset Password</DropdownMenuItem>
        <DropdownMenuItem>Edit User</DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-600 hover:text-red-700"
          onClick={() => {
            console.log(`User GC account ID: ${user.gc_account_id}`);
          }}
        >
          Debug GC ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
