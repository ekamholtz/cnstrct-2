
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RegisterFormData, LoginFormData, CompanyDetailsFormData } from "@/components/auth/authSchemas";

export const useAuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      setIsLoading(true);
      console.log("Handle register called with:", data);
      console.log("Registering with role:", data.role); // Debug log
      
      try {
        // First create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              full_name: `${data.firstName} ${data.lastName}`,
              company_name: data.companyName,
              role: data.role, // Explicitly pass the role from the form
            },
          },
        });
        
        if (authError) {
          console.error("Registration error:", authError);
          throw authError;
        }

        if (!authData.user) {
          throw new Error("No user data returned from signup");
        }

        // Create GC account for gc_admin users
        let gcAccount = null;
        
        if (data.role === 'gc_admin') {
          try {
            // Create a GC account
            const { data: gcAccountData, error: gcError } = await supabase
              .from('gc_accounts')
              .insert([
                { 
                  company_name: data.companyName, 
                  owner_id: authData.user.id,
                  created_at: new Date(),
                  updated_at: new Date()
                }
              ])
              .select('id, company_name')
              .single();
            
            if (gcError) {
              console.error("Error creating GC account:", gcError);
              throw gcError;
            } 
            
            gcAccount = gcAccountData;
          } catch (error) {
            console.error("Error in GC account creation process:", error);
            throw error;
          }
        }
        
        // Create the profile record
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                full_name: `${data.firstName} ${data.lastName}`,
                role: data.role,
                gc_account_id: gcAccount?.id || null,
                account_status: 'active',
                has_completed_profile: false,
                created_at: new Date(),
                updated_at: new Date()
              }
            ]);
          
          if (profileError) {
            console.error("Error creating profile:", profileError);
            throw profileError;
          }
        } catch (error) {
          console.error("Error in profile creation:", error);
          throw error;
        }
        
        return { 
          user: authData.user,
          role: data.role,
          gcAccount
        };
      } catch (error) {
        // Handle any overall errors
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      
      // For gc_admin, redirect to company details page
      if (data.role === 'gc_admin' && data.gcAccount) {
        navigate("/auth/company-details", { 
          state: { 
            gcAccountId: data.gcAccount.id,
            companyName: data.gcAccount.company_name,
            isNewUser: true
          } 
        });
      } else {
        // For other user types, redirect to login
        navigate("/auth");
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      console.error("Registration error details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to register. Please try again.",
      });
    },
  });

  // New mutation for updating company details
  const updateCompanyDetailsMutation = useMutation({
    mutationFn: async ({ gcAccountId, data }: { gcAccountId: string, data: CompanyDetailsFormData }) => {
      setIsLoading(true);
      
      try {
        // Update the GC account with company details
        const { error } = await supabase
          .from('gc_accounts')
          .update({
            website: data.website,
            license_number: data.licenseNumber,
            address: data.address,
            phone_number: data.phoneNumber,
            updated_at: new Date()
          })
          .eq('id', gcAccountId);
        
        if (error) {
          console.error("Error updating company details:", error);
          throw error;
        }
        
        return { gcAccountId };
      } catch (error) {
        console.error("Error in company details update:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Company details saved successfully!",
      });
      
      // Get the current authentication session before redirecting
      const currentSession = supabase.auth.session;
      console.log("Current session before subscription redirect:", currentSession ? "Valid" : "None");
      
      // Redirect to subscription checkout with state preserved
      navigate("/subscription-checkout", { 
        state: { 
          gcAccountId: variables.gcAccountId,
          isNewUser: true 
        }
      });
    },
    onError: (error: any) => {
      setIsLoading(false);
      console.error("Company details update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update company details. Please try again.",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      console.log("Attempting login for:", data.email);
      setIsLoading(true);
      const { data: authResponse, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error("Login error:", error);
        throw error;
      }

      if (!authResponse?.user) {
        console.error("No user data returned");
        throw new Error("Could not authenticate user");
      }

      console.log("Auth response:", authResponse);

      // Query the profiles table to get the user's role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, has_completed_profile, gc_account_id')
        .eq('id', authResponse.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      // If no profile is found, use the role from auth metadata or default to gc_admin
      const role = profileData?.role || authResponse.user.user_metadata?.role || 'gc_admin';
      const hasCompletedProfile = profileData?.has_completed_profile || false;
      const gcAccountId = profileData?.gc_account_id;
      
      // Query the gc_accounts table to check for subscription
      let hasSubscription = false;
      if (gcAccountId) {
        const { data: gcAccountData, error: gcAccountError } = await supabase
          .from('gc_accounts')
          .select('subscription_tier_id')
          .eq('id', gcAccountId)
          .maybeSingle();
          
        if (!gcAccountError && gcAccountData) {
          hasSubscription = !!gcAccountData.subscription_tier_id;
        }
      }
      
      console.log("Determined role:", role);
      console.log("Profile completion status:", hasCompletedProfile);
      console.log("Has subscription:", hasSubscription);

      return { 
        role, 
        hasCompletedProfile, 
        hasSubscription,
        userId: authResponse.user.id,
        gcAccountId
      };
    },
    onSuccess: (data) => {
      setIsLoading(false);
      
      // Redirect based on user state
      if (data.role === 'gc_admin') {
        if (!data.hasSubscription) {
          navigate("/subscription-checkout", { 
            state: { 
              userId: data.userId, 
              gcAccountId: data.gcAccountId,
              isNewUser: false 
            } 
          });
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      console.error("Login error details:", error);
      toast({
        variant: "destructive",
        title: "Error", 
        description: error.message || "Failed to sign in. Please check your credentials and try again.",
      });
    },
  });

  const handleRegister = async (data: RegisterFormData) => {
    return registerMutation.mutateAsync(data);
  };

  const handleLogin = async (data: LoginFormData) => {
    return loginMutation.mutateAsync(data);
  };

  return {
    isLoading,
    handleRegister,
    handleLogin,
    registerMutation,
    loginMutation,
    updateCompanyDetailsMutation
  };
};
