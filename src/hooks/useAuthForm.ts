
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { RegisterFormData } from '@/components/auth/authSchemas';

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

  const createUserProfile = async (userId: string, userData: any) => {
    try {
      const fullName = `${userData.firstName} ${userData.lastName}`.trim();
      const role = userData.role || 'gc_admin';
      
      console.log("Creating profile for user:", userId);
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          full_name: fullName,
          role: role,
          company_name: userData.companyName || null,
          account_status: 'active',
          has_completed_profile: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error creating profile:", error);
        return false;
      }
      
      console.log("Profile created successfully");
      return true;
    } catch (error) {
      console.error("Unexpected error creating profile:", error);
      return false;
    }
  };

  const signUp = async (formData: RegisterFormData) => {
    setIsLoading(true);
    const errors: { [key: string]: string } = {};

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      console.log("Starting signup process", { 
        email: formData.email, 
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role || 'gc_admin',
        companyName: formData.companyName
      });
      
      // Create a cleaned-up data object for the user metadata
      const userMetadata = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_name: formData.companyName,
        role: formData.role || 'gc_admin',
        full_name: `${formData.firstName} ${formData.lastName}`
      };
      
      console.log("User metadata prepared:", userMetadata);
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log("Signup response details:", 
        JSON.stringify({
          user: data?.user?.id ? "User created" : "No user created",
          error: error ? error.message : "No error"
        })
      );

      if (error) {
        console.error("Signup error details:", error);
        errors.email = error.message;
        setFormErrors(errors);
        toast({
          variant: "destructive",
          title: "Registration Error",
          description: error.message || "Failed to create account",
        });
      } else if (data.user) {
        // Create profile directly from frontend instead of relying solely on the database trigger
        const profileCreated = await createUserProfile(data.user.id, {
          ...formData,
          email: formData.email,
        });
        
        if (!profileCreated) {
          console.warn("Failed to create profile, will rely on database trigger as fallback");
        }
        
        console.log("Signup successful, redirecting user");
        toast({
          title: 'Account Created',
          description: 'Your account has been created successfully. Please complete your company details.',
        });
        
        // Redirect to company details page if role is gc_admin, otherwise dashboard
        if (formData.role === 'gc_admin') {
          navigate('/auth/company-details');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error("Unexpected error during signup:", error);
      errors.email = error.message || 'An unexpected error occurred';
      setFormErrors(errors);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: error.message || "An unexpected error occurred",
      });
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
