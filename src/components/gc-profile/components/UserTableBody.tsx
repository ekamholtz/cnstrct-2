
import { RefreshCw } from "lucide-react";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { GCUserProfile } from "../types";
import { UserActionsMenu } from "./UserActionsMenu";
import { RoleBadge } from "./RoleBadge";

interface UserTableBodyProps {
  users: GCUserProfile[];
  filteredUsers: GCUserProfile[];
  isLoading: boolean;
  canManageUsers: boolean;
  searchQuery: string;
}

export const UserTableBody = ({ 
  users, 
  filteredUsers, 
  isLoading, 
  canManageUsers,
  searchQuery
}: UserTableBodyProps) => {
  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={canManageUsers ? 5 : 4} className="text-center py-4">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading users...
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (users?.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={canManageUsers ? 5 : 4} className="text-center py-4">
            No users found. {canManageUsers && "Click 'Invite User' to add team members."}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={canManageUsers ? 5 : 4} className="text-center py-4">
            {searchQuery ? "No users match your search" : "No users found"}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {filteredUsers.map((user) => (
        <TableRow key={user.id}>
          <TableCell>{user.full_name || 'N/A'}</TableCell>
          <TableCell>{user.email || 'N/A'}</TableCell>
          <TableCell>{user.phone_number || 'N/A'}</TableCell>
          <TableCell>
            <RoleBadge role={user.role} />
          </TableCell>
          {canManageUsers && (
            <TableCell className="text-right">
              <UserActionsMenu user={user} />
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  );
};
