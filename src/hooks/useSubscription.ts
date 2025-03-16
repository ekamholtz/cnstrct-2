import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPlan } from '@/components/project/invoice/types';

export interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  plan_name: string;
  cancel_at_period_end: boolean;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  fee_percentage: number;
  features?: string[];
}

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-subscriptions/get-subscription`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch subscription');
        }

        const data = await response.json();
        return data.subscription;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
    },
  });

  // Fetch available subscription plans from Stripe
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-subscriptions/get-plans`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch plans');
        }

        const data = await response.json();
        return data.plans || [];
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        return [];
      }
    },
  });

  // Fetch available subscription tiers from Supabase
  const { data: tiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ['subscription-tiers'],
    queryFn: async (): Promise<SubscriptionTier[]> => {
      try {
        // Fetch tiers
        const { data: tiersData, error: tiersError } = await supabase
          .from('subscription_tiers')
          .select('*')
          .order('price', { ascending: true });

        if (tiersError) throw tiersError;
        
        // For each tier, fetch its features
        const tiersWithFeatures = await Promise.all(
          tiersData.map(async (tier) => {
            const { data: features, error: featuresError } = await supabase
              .from('tier_features')
              .select('feature_key')
              .eq('tier_id', tier.id);
              
            if (featuresError) {
              console.error('Error fetching tier features:', featuresError);
              return { ...tier, features: [] };
            }
            
            return { 
              ...tier, 
              features: features.map(f => f.feature_key) 
            };
          })
        );
        
        return tiersWithFeatures;
      } catch (error) {
        console.error('Error fetching subscription tiers:', error);
        return [];
      }
    },
  });

  // Fetch user's current subscription tier
  const { data: userTier, isLoading: isLoadingUserTier } = useQuery({
    queryKey: ['user-subscription-tier'],
    queryFn: async (): Promise<SubscriptionTier | null> => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        // Get user's profile with subscription tier
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_tier_id, gc_account_id')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // First check if the user has a direct subscription tier
        if (profile.subscription_tier_id) {
          const { data: tier, error: tierError } = await supabase
            .from('subscription_tiers')
            .select('*')
            .eq('id', profile.subscription_tier_id)
            .single();
            
          if (tierError) throw tierError;
          return tier;
        }
        
        // If user has a GC account, check if there's an account subscription
        if (profile.gc_account_id) {
          const { data: accountSub, error: accountSubError } = await supabase
            .from('account_subscriptions')
            .select('tier_id')
            .eq('gc_account_id', profile.gc_account_id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (accountSubError) {
            // No active subscription, return null
            if (accountSubError.code === 'PGRST116') {
              return null;
            }
            throw accountSubError;
          }
          
          // Get the tier details
          const { data: tier, error: tierError } = await supabase
            .from('subscription_tiers')
            .select('*')
            .eq('id', accountSub.tier_id)
            .single();
            
          if (tierError) throw tierError;
          return tier;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching user subscription tier:', error);
        return null;
      }
    },
  });

  // Create checkout session
  const createCheckoutSession = async (plan: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to subscribe');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          returnUrl: `${window.location.origin}/settings`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: 'destructive',
        title: 'Subscription Error',
        description: error.message || 'Failed to start subscription process',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to cancel your subscription');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-subscriptions/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription will be canceled at the end of the billing period',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Subscription Error',
        description: error.message || 'Failed to cancel subscription',
      });
    },
  });

  // Resume subscription
  const resumeSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to resume your subscription');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-subscriptions/resume-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resume subscription');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been resumed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Subscription Error',
        description: error.message || 'Failed to resume subscription',
      });
    },
  });

  // Create customer portal session
  const createPortalSession = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to manage your subscription');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-subscriptions/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create customer portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast({
        variant: 'destructive',
        title: 'Subscription Error',
        description: error.message || 'Failed to open subscription management portal',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Change subscription tier (for local database tiers)
  const changeTier = useMutation({
    mutationFn: async (tierId: string) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to change subscription tier');
      
      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id, role')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // If user is gc_admin and has gc_account_id, update account subscription
      if (profile.role === 'gc_admin' && profile.gc_account_id) {
        // Check if there's an existing subscription
        const { data: existingSub, error: subError } = await supabase
          .from('account_subscriptions')
          .select('id')
          .eq('gc_account_id', profile.gc_account_id)
          .eq('status', 'active')
          .maybeSingle();
          
        if (subError && subError.code !== 'PGRST116') throw subError;
        
        // If there's an existing subscription, update it
        if (existingSub) {
          const { error: updateError } = await supabase
            .from('account_subscriptions')
            .update({ 
              tier_id: tierId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSub.id);
            
          if (updateError) throw updateError;
        } else {
          // Otherwise create a new subscription
          const { error: insertError } = await supabase
            .from('account_subscriptions')
            .insert({
              gc_account_id: profile.gc_account_id,
              tier_id: tierId,
              status: 'active',
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year subscription
            });
            
          if (insertError) throw insertError;
        }
      } else {
        // Just update the user's profile directly
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            subscription_tier_id: tierId,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription tier has been changed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['user-subscription-tier'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Subscription Error',
        description: error.message || 'Failed to change subscription tier',
      });
    },
  });

  return {
    subscription,
    plans,
    tiers,
    userTier,
    isLoading: isLoading || isLoadingSubscription || isLoadingPlans || isLoadingTiers || isLoadingUserTier,
    createCheckoutSession,
    cancelSubscription,
    resumeSubscription,
    createPortalSession,
    changeTier,
  };
};
