
import { UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { type UserProfile } from "./types";

interface UserTableProps {
  users: UserProfile[];
  isLoading: boolean;
  updateUserStatus: (userId: string, newStatus: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserProfile['role']) => Promise<void>;
  getStatusBadgeColor: (status: string) => string;
}

export const UserTable = ({
  users,
  isLoading,
  updateUserStatus,
  updateUserRole,
  getStatusBadgeColor,
}: UserTableProps) => {
  return (
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
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4">
              No users found
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
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
                      {(['platform_admin', 'gc_admin', 'project_manager', 'homeowner'] as const).map((role) => (
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
  );
};
