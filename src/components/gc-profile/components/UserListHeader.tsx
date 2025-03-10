import { Plus, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserListHeaderProps {
  onCreateUser: () => void;
  onRefresh?: () => void;
  canManageUsers: boolean;
}

export const UserListHeader = ({ onCreateUser, onRefresh, canManageUsers }: UserListHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-cnstrct-navy">Team Members</h2>
      </div>
      <div className="flex gap-3">
        {onRefresh && (
          <Button 
            variant="outline" 
            onClick={onRefresh} 
            size="icon" 
            title="Refresh user list"
            className="border-gray-200 hover:bg-gray-50 text-gray-600"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {canManageUsers && (
          <Button 
            onClick={onCreateUser}
            className="bg-cnstrct-navy hover:bg-cnstrct-navy/90 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>
    </div>
  );
};
