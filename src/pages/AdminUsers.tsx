
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { UserFilters } from "@/components/admin/users/UserFilters";
import { UserTable } from "@/components/admin/users/UserTable";
import { useUserManagement } from "@/components/admin/users/useUserManagement";

const AdminUsers = () => {
  const {
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    users,
    isLoading,
    updateUserStatus,
    updateUserRole,
    getStatusBadgeColor,
  } = useUserManagement();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>

        <UserFilters
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <Card>
          <UserTable
            users={users}
            isLoading={isLoading}
            updateUserStatus={updateUserStatus}
            updateUserRole={updateUserRole}
            getStatusBadgeColor={getStatusBadgeColor}
          />
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
