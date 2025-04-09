
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { useAuth } from '@/hooks/useAuth';

// Default trial tier ID - using the free tier ID
const TRIAL_TIER_ID = '00000000-0000-0000-0000-000000000001';

export default function SubscriptionSelection() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Effect to load Stripe Pricing Table script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
    
    // Check if trial tier exists, if not create it
    const ensureTrialTier = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('id', TRIAL_TIER_ID)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking trial tier:', error);
        }
        
        // If tier doesn't exist, create it
        if (!data) {
          const { error: insertError } = await supabase
            .from('subscription_tiers')
            .insert([
              {
                id: TRIAL_TIER_ID,
                name: 'Trial',
                description: 'Free trial with limited features',
                price: 0,
                fee_percentage: 0,
                max_projects: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
            
          if (insertError) {
            console.error('Error creating trial tier:', insertError);
          } else {
            console.log('Trial tier created successfully');
          }
        } else {
          // Update existing tier to make sure it has the right attributes
          const { error: updateError } = await supabase
            .from('subscription_tiers')
            .update({
              name: 'Trial',
              description: 'Free trial with limited features',
              max_projects: 2,
              updated_at: new Date().toISOString()
            })
            .eq('id', TRIAL_TIER_ID);
            
          if (updateError) {
            console.error('Error updating trial tier:', updateError);
          } else {
            console.log('Trial tier updated successfully');
          }
        }
      } catch (error) {
        console.error('Unexpected error ensuring trial tier:', error);
      } finally {
        setLoading(false);
      }
    };
    
    ensureTrialTier();
  }, []);

  const selectTrialTier = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to select a subscription tier.'
      });
      navigate('/auth');
      return;
    }
    
    setSubmitting(true);

    try {
      // Get user's profile to check gc_account_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        throw profileError;
      }
      
      if (!profileData.gc_account_id) {
        throw new Error('No GC account found. Please complete your company details first.');
      }
      
      // Update the user's profile with the trial subscription tier
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier_id: TRIAL_TIER_ID,
          has_completed_profile: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateProfileError) {
        throw updateProfileError;
      }
      
      // Create an account_subscriptions record
      const { error: subscriptionError } = await supabase
        .from('account_subscriptions')
        .insert([
          {
            gc_account_id: profileData.gc_account_id,
            tier_id: TRIAL_TIER_ID,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30-day trial
          }
        ]);
      
      if (subscriptionError) {
        throw subscriptionError;
      }
      
      toast({
        title: 'Success',
        description: 'Trial subscription activated successfully!'
      });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error selecting trial tier:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to activate trial subscription.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cnstrct-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-cnstrct-navy/5 to-cnstrct-navy/10 z-0"></div>
      <AnimatedGridPattern 
        className="z-0" 
        lineColor="rgba(16, 24, 64, 0.07)" 
        dotColor="rgba(16, 24, 64, 0.15)"
        lineOpacity={0.3}
        dotOpacity={0.5}
        speed={0.2}
        size={35}
      />

      {/* Header */}
      <header className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10 relative">
        <div className="container mx-auto">
          <img
            src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
            alt="CNSTRCT Logo"
            className="h-10"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 z-10 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-cnstrct-navy mb-3">Select Your Subscription Plan</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the subscription tier that best fits your business needs. You can upgrade or downgrade your plan at any time.
            </p>
          </div>

          <div className="mb-12">
            <Card className="bg-white/90 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Subscription Plans</CardTitle>
                <CardDescription>
                  Select a plan to unlock all features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <stripe-pricing-table 
                  pricing-table-id="prctbl_1R98Y3Apu80f9E3H7bPpRkjs"
                  publishable-key="pk_test_51QzjhnApu80f9E3HjlgkmHwM1a4krzjoz0sJlsz41wIhMYIr1sst6sx2mCZ037PiY2UE6xfNA5zzkxCQwOAJ4yoD00gm7TIByL">
                </stripe-pricing-table>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <div className="mb-8">
              <div className="relative flex items-center justify-center mb-6">
                <hr className="w-full border-t border-gray-300" />
                <span className="absolute bg-gray-50 px-4 text-gray-500 text-sm">or</span>
              </div>
              <h2 className="text-xl font-semibold text-cnstrct-navy mb-2">Not ready to subscribe?</h2>
              <p className="text-gray-600 mb-6">
                Try our platform with a free trial that allows you to create up to 2 projects.
              </p>
            </div>
            
            <Button
              size="lg"
              variant="outline"
              className="border-cnstrct-orange text-cnstrct-orange hover:bg-cnstrct-orange/10 py-6 px-8 rounded-xl font-medium text-lg shadow-md hover:shadow-lg transition-all"
              onClick={selectTrialTier}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue with Free Trial'
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm z-10 relative">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            By continuing, you agree to CNSTRCT's{" "}
            <a href="#" className="text-cnstrct-orange hover:underline font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-cnstrct-orange hover:underline font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
