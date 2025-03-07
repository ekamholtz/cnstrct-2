
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
    <div className="space-y-5 animate-fadeIn">
      <UserListHeader 
        onCreateUser={onCreateUser}
        onRefresh={onRefresh}
        canManageUsers={canManageUsers}
      />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="p-4 border-b border-gray-100">
          <UserSearch 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
        
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                <TableHead className="font-semibold text-gray-700">Role</TableHead>
                <TableHead className="font-semibold text-gray-700">Profile Complete</TableHead>
                {canManageUsers && <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>}
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
    </div>
  );
};
