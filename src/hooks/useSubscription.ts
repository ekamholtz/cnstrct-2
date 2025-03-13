
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  plan_name: string;
  cancel_at_period_end: boolean;
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

  return {
    subscription,
    isLoading: isLoading || isLoadingSubscription,
    createCheckoutSession,
    cancelSubscription,
    resumeSubscription,
    createPortalSession,
  };
};
