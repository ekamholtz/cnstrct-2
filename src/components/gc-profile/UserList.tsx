import { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GCUserProfile } from "./types";
import { UserListHeader } from "./components/UserListHeader";
import { UserSearch } from "./components/UserSearch";
import { UserTableBody } from "./components/UserTableBody";

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
  const [filteredUsers, setFilteredUsers] = useState<GCUserProfile[]>([]);

  // Effect to filter users and provide more detailed logging
  useEffect(() => {
    // Log raw users array for debugging
    console.log("UserList - Raw users array:", users);
    console.log("UserList - Users length:", users?.length);
    
    if (!users || users.length === 0) {
      console.log("UserList - No users available to filter");
      setFilteredUsers([]);
      return;
    }
    
    const filtered = users.filter(user => {
      const nameMatch = user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const phoneMatch = user.phone_number && user.phone_number.includes(searchQuery);
      
      return nameMatch || emailMatch || phoneMatch;
    });
    
    console.log(`UserList - Filtered from ${users.length} to ${filtered.length} users with query "${searchQuery}"`);
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  return (
    <div className="space-y-5">
      <UserListHeader 
        onCreateUser={onCreateUser}
        onRefresh={onRefresh}
        canManageUsers={canManageUsers}
      />
      
      <UserSearch 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <div className="rounded-lg border border-gray-200/60 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-medium text-cnstrct-navy">Name</TableHead>
              <TableHead className="font-medium text-cnstrct-navy">Email</TableHead>
              <TableHead className="font-medium text-cnstrct-navy">Phone</TableHead>
              <TableHead className="font-medium text-cnstrct-navy">Role</TableHead>
              <TableHead className="font-medium text-cnstrct-navy">Profile Complete</TableHead>
              {canManageUsers && <TableHead className="text-right font-medium text-cnstrct-navy">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <UserTableBody 
            users={users}
            filteredUsers={filteredUsers}
            isLoading={isLoading}
            canManageUsers={canManageUsers}
            searchQuery={searchQuery}
          />
        </Table>
      </div>
    </div>
  );
};
