
import { UserRole } from "@/components/admin/users/types";

/**
 * Maps UserRole to UI role string for compatibility with components
 * that expect a more limited set of roles
 */
export const mapUserRoleToUIRole = (role: UserRole | string | null | undefined): UserRole | undefined => {
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
      return 'gc_admin'; // Return actual role for admin roles
    case 'platform_admin':
      return 'platform_admin'; // Return actual role for admin roles
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

/**
 * Check if a role string is one of the admin roles
 */
export const isRoleAdmin = (role: string | null | undefined): boolean => {
  return role === 'gc_admin' || role === 'platform_admin';
};

/**
 * Type guard to check if a string is a valid UserRole
 */
export const isValidUserRole = (role: string | null | undefined): role is UserRole => {
  if (!role) return false;
  return ['homeowner', 'contractor', 'employee', 'client', 'gc_admin', 'platform_admin', 'project_manager'].includes(role);
};

/**
 * Safe conversion from any role string to UserRole with fallback
 */
export const toUserRole = (role: string | null | undefined, fallback: UserRole = 'contractor'): UserRole => {
  if (!role) return fallback;
  return isValidUserRole(role) ? role : fallback;
};
