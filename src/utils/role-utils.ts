
import { UserRole } from "@/components/admin/users/types";

/**
 * Maps UserRole to UI role string for compatibility with components
 * that expect a more limited set of roles
 */
export const mapUserRoleToUIRole = (role: UserRole | string | null | undefined): "homeowner" | "contractor" | "project_manager" | undefined => {
  if (!role) return undefined;
  
  switch (role) {
    case 'homeowner':
    case 'client':
      return 'homeowner';
    case 'contractor':
    case 'employee':
      return 'contractor';
    case 'project_manager':
      return 'project_manager';
    case 'gc_admin':
    case 'platform_admin':
      // These roles need special handling in UI components
      return 'contractor'; // Default mapping for admin roles in UI contexts
    default:
      return undefined;
  }
};

/**
 * Checks if a user role is an admin-level role
 */
export const isAdminRole = (role: UserRole | string | null | undefined): boolean => {
  return role === 'gc_admin' || role === 'platform_admin';
};

/**
 * Get the appropriate role for team display based on actual role
 */
export const getTeamDisplayRole = (role: UserRole | string): string => {
  switch (role) {
    case 'gc_admin':
      return 'Administrator';
    case 'platform_admin':
      return 'Platform Admin';
    case 'project_manager':
      return 'Project Manager';
    case 'contractor':
      return 'Contractor';
    case 'employee':
      return 'Team Member';
    case 'homeowner':
    case 'client':
      return 'Client';
    default:
      return role;
  }
};
