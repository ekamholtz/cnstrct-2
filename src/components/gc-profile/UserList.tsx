
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
    
    if (!users || users.length === 0) {
      setFilteredUsers([]);
      return;
    }
    
    const filtered = users.filter(user => 
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.phone_number && user.phone_number.includes(searchQuery))
    );
    
    console.log(`UserList - Filtered from ${users.length} to ${filtered.length} users with query "${searchQuery}"`);
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  console.log("UserList rendering. Users:", users?.length, "Filtered:", filteredUsers.length, "Loading:", isLoading, "User data:", users);

  return (
    <div className="space-y-4">
      <UserListHeader 
        onCreateUser={onCreateUser}
        onRefresh={onRefresh}
        canManageUsers={canManageUsers}
      />
      
      <UserSearch 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
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
