
import { useState } from "react";
import { UserCog, Plus, Search, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GCUserProfile } from "./types";

interface UserListProps {
  users: GCUserProfile[];
  isLoading: boolean;
  canManageUsers: boolean;
  onCreateUser: () => void;
  onRefresh?: () => void;
}

export const UserList = ({
  users,
  isLoading,
  canManageUsers,
  onCreateUser,
  onRefresh,
}: UserListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users?.filter(user => 
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.phone_number && user.phone_number.includes(searchQuery))
  ) || [];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'gc_admin':
        return 'bg-blue-100 text-blue-800';
      case 'project_manager':
        return 'bg-green-100 text-green-800';
      case 'platform_admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  console.log("UserList rendering. Users:", users?.length, "Filtered:", filteredUsers.length, "Loading:", isLoading);

  return (
    <div className="space-y-4">
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
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search users..."
          className="pl-10"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManageUsers ? 5 : 4} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageUsers ? 5 : 4} className="text-center py-4">
                  No users found. {canManageUsers && "Click 'Invite User' to add team members."}
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageUsers ? 5 : 4} className="text-center py-4">
                  {searchQuery ? "No users match your search" : "No users found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>{user.phone_number || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </TableCell>
                  {canManageUsers && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Reset Password</DropdownMenuItem>
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
