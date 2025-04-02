import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export const useAuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateEmail = (email: string): string | null => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!regex.test(email)) return 'Email is invalid';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    const errors: { [key: string]: string } = {};

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        errors.email = error.message;
        setFormErrors(errors);
      } else {
        toast({
          title: 'Success',
          description: 'Account created successfully.',
        });
        
        // Redirect to company details page for new users
        navigate('/auth/company-details');
      }
    } catch (error: any) {
      errors.email = error.message || 'An unexpected error occurred';
      setFormErrors(errors);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setFormErrors({});
    const errors: { [key: string]: string } = {};

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        errors.email = error.message;
        setFormErrors(errors);
      } else {
        toast({
          title: 'Success',
          description: 'Signed in successfully.',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      errors.email = error.message || 'An unexpected error occurred';
      setFormErrors(errors);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    const errors: { [key: string]: string } = {};
    
    try {
      if (!email) {
        errors.email = 'Email is required';
        setFormErrors(errors);
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        errors.email = error.message;
        setFormErrors(errors);
      } else {
        setResetEmailSent(true);
      }
    } catch (error: any) {
      errors.email = error.message || 'An error occurred during password reset';
      setFormErrors(errors);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    setIsLoading(true);
    setFormErrors({});
    const errors: { [key: string]: string } = {};

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        errors.password = error.message;
        setFormErrors(errors);
      } else {
        toast({
          title: 'Success',
          description: 'Password updated successfully.',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      errors.password = error.message || 'An unexpected error occurred';
      setFormErrors(errors);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    formErrors,
    resetEmailSent,
    signUp,
    signIn,
    resetPassword,
    updatePassword,
  };
};
