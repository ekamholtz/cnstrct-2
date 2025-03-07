
import { RefreshCw } from "lucide-react";
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

  // Debug logs for users data to help diagnose the issue
  if (users?.length > 0) {
    console.log("First few users data:", users.slice(0, 3).map(user => ({
      id: user.id,
      name: user.full_name,
      role: user.role
    })));
  }

  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin mr-2 text-blue-600" />
              <span className="text-blue-600 font-medium">Loading users...</span>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (!users || users.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-8">
            <div className="text-slate-500">
              No users found. {canManageUsers && <span className="text-blue-600 font-medium">Click 'Invite User' to add team members.</span>}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (filteredUsers.length === 0 && searchQuery) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-8">
            <div className="text-slate-500">
              No users match your search criteria.
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  // If we have users but no filtered users (without a search query), show all users
  const usersToDisplay = searchQuery ? filteredUsers : users;
  
  // Debug log for users being displayed
  console.log(`UserTableBody - Displaying ${usersToDisplay.length} users:`, 
    usersToDisplay.map(u => ({id: u.id, name: u.full_name}))
  );
  
  return (
    <TableBody>
      {usersToDisplay.map((user) => (
        <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
          <TableCell className="py-3">
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-medium text-slate-800">{user.full_name || 'N/A'}</span>
                {user.is_owner && (
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                    Owner
                  </Badge>
                )}
              </div>
              {user.email && <span className="text-xs text-slate-500 mt-1">{user.email}</span>}
            </div>
          </TableCell>
          <TableCell className="text-slate-600">{user.email || user.id}</TableCell>
          <TableCell>
            {user.phone_number ? 
              <span className="text-slate-600">{user.phone_number}</span> : 
              <span className="text-slate-400 italic">Not provided</span>
            }
          </TableCell>
          <TableCell>
            <RoleBadge role={user.role} />
          </TableCell>
          <TableCell>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.has_completed_profile 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-50 text-slate-700 border border-slate-200'
            }`}>
              {user.has_completed_profile ? "Yes" : "No"}
            </span>
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
