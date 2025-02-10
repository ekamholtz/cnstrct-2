
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserCog } from "lucide-react";

type UserRole = 'admin' | 'general_contractor' | 'homeowner';

type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  account_status: string;
};

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          account_status
        `);
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      return data as UserProfile[];
    }
  });

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      await supabase.from('admin_actions').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'user',
        entity_id: userId,
        action_type: `update_status_${newStatus}`,
        details: { new_status: newStatus }
      });

      toast({
        title: "Success",
        description: "User status updated successfully",
      });

      refetch();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await supabase.from('admin_actions').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'user',
        entity_id: userId,
        action_type: 'update_role',
        details: { new_role: newRole }
      });

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      refetch();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role",
      });
    }
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.account_status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>

        <Card className="mb-6">
          <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="general_contractor">General Contractor</SelectItem>
                  <SelectItem value="homeowner">Homeowner</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" className="h-8 w-full justify-start px-2">
                            {user.role}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Update User Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Select a new role for {user.full_name}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="grid gap-4">
                            {(['admin', 'general_contractor', 'homeowner'] as const).map((role) => (
                              <Button
                                key={role}
                                variant={user.role === role ? "default" : "outline"}
                                onClick={() => {
                                  updateUserRole(user.id, role);
                                }}
                              >
                                {role}
                              </Button>
                            ))}
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(user.account_status)}>
                        {user.account_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Update User Status</AlertDialogTitle>
                            <AlertDialogDescription>
                              Select a new status for {user.full_name}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="grid gap-4">
                            {['active', 'suspended', 'pending_approval'].map((status) => (
                              <Button
                                key={status}
                                variant={user.account_status === status ? "default" : "outline"}
                                onClick={() => {
                                  updateUserStatus(user.id, status);
                                }}
                              >
                                {status}
                              </Button>
                            ))}
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
