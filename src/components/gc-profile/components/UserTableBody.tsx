import { RefreshCw, UserRound } from "lucide-react";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { GCUserProfile } from "../types";
import { UserActionsMenu } from "./UserActionsMenu";
import { RoleBadge } from "./RoleBadge";
import { Badge } from "@/components/ui/badge";

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
  console.log("UserTableBody rendering with:", {
    usersLength: users?.length,
    filteredUsersLength: filteredUsers?.length,
    isLoading,
    canManageUsers,
    searchQuery
  });

  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-8">
            <div className="flex items-center justify-center text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin mr-2 text-cnstrct-navy/70" />
              Loading team members...
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
          <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-8">
            <div className="flex flex-col items-center justify-center text-gray-500 py-4">
              <UserRound className="h-10 w-10 text-gray-300 mb-2" />
              <p>No team members found</p>
              {canManageUsers && <p className="text-sm mt-1">Click 'Invite User' to add team members</p>}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-8">
            <div className="flex flex-col items-center justify-center text-gray-500 py-4">
              <UserRound className="h-10 w-10 text-gray-300 mb-2" />
              <p>{searchQuery ? "No team members match your search" : "No team members found"}</p>
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {filteredUsers.map((user) => (
        <TableRow key={user.id} className="hover:bg-gray-50">
          <TableCell className="font-medium">
            {user.full_name || 'N/A'}
            {user.is_owner && (
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200 text-xs">
                Owner
              </Badge>
            )}
          </TableCell>
          <TableCell className="text-gray-600">{user.email || 'N/A'}</TableCell>
          <TableCell className="text-gray-600">{user.phone_number || 'N/A'}</TableCell>
          <TableCell>
            <RoleBadge role={user.role} />
          </TableCell>
          <TableCell>
            {user.has_completed_profile ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Incomplete
              </Badge>
            )}
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
