
import type { LoginFormData, RegisterFormData } from "@/components/auth/authSchemas";

export type UseAuthReturn = {
  loading: boolean;
  handleLogin: (values: LoginFormData) => Promise<void>;
  handleRegister: (values: RegisterFormData, selectedRole: 'homeowner' | 'gc_admin') => Promise<void>;
};
