
import { useLogin } from "./auth/useLogin";
import { useRegister } from "./auth/useRegister";
import type { UseAuthReturn } from "./auth/types";

export const useAuthForm = (): UseAuthReturn => {
  const { loading: loginLoading, handleLogin } = useLogin();
  const { loading: registerLoading, handleRegister } = useRegister();

  return {
    loading: loginLoading || registerLoading,
    handleLogin,
    handleRegister
  };
};

