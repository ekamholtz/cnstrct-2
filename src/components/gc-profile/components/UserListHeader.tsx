
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserListHeaderProps {
  onCreateUser: () => void;
  onRefresh?: () => void;
  canManageUsers: boolean;
}

export const UserListHeader = ({ onCreateUser, onRefresh, canManageUsers }: UserListHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Team Members</h2>
      <div className="flex gap-2">
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} size="icon" title="Refresh user list">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {canManageUsers && (
          <Button onClick={onCreateUser}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>
    </div>
  );
};
