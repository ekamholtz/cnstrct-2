import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';

interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface LocationState {
  userId: string;
  isNewUser: boolean;
}

const SubscriptionSelection = () => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as LocationState;

  useEffect(() => {
    const fetchSubscriptionTiers = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_tiers')
          .select('*')
          .order('price', { ascending: true });

        if (error) {
          throw error;
        }

        // If no tiers exist yet, create some default ones for development
        if (!data || data.length === 0) {
          console.log('No subscription tiers found, creating default tiers');
          const defaultTiers: SubscriptionTier[] = [
            {
              id: 'basic',
              name: 'Basic',
              description: 'Essential features for small contractors',
              price: 29.99,
              features: ['Up to 5 projects', 'Basic reporting', 'Email support']
            },
            {
              id: 'professional',
              name: 'Professional',
              description: 'Advanced features for growing businesses',
              price: 79.99,
              features: ['Unlimited projects', 'Advanced reporting', 'Priority support', 'Team collaboration']
            },
            {
              id: 'enterprise',
              name: 'Enterprise',
              description: 'Complete solution for large contractors',
              price: 149.99,
              features: ['Unlimited projects', 'Custom reporting', 'Dedicated support', 'Advanced analytics', 'API access']
            }
          ];
          setTiers(defaultTiers);
          setSelectedTier('professional'); // Default to professional tier
        } else {
          // Parse features from JSON if stored that way
          const formattedTiers = data.map(tier => ({
            ...tier,
            features: Array.isArray(tier.features) 
              ? tier.features 
              : typeof tier.features === 'string' 
                ? JSON.parse(tier.features) 
                : []
          }));
          setTiers(formattedTiers);
          setSelectedTier(formattedTiers[1]?.id || formattedTiers[0]?.id); // Default to second tier or first if only one
        }
      } catch (error) {
        console.error('Error fetching subscription tiers:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load subscription options. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionTiers();
  }, [toast]);

  const handleContinue = async () => {
    if (!selectedTier || !state?.userId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a subscription tier to continue.'
      });
      return;
    }

    setSubmitting(true);

    try {
      // Update the user's profile with the selected subscription tier
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier_id: selectedTier,
          has_completed_profile: state.isNewUser ? false : true // If new user, they still need to complete profile
        })
        .eq('id', state.userId);

      if (error) {
        throw error;
      }

      // Create a subscription record
      const now = new Date();
      const endDate = new Date();
      endDate.setFullYear(now.getFullYear() + 1); // Default to 1 year subscription

      const { data: gcAccountData, error: gcAccountError } = await supabase
        .from('profiles')
        .select('gc_account_id')
        .eq('id', state.userId)
        .single();

      if (gcAccountError) {
        throw gcAccountError;
      }

      if (gcAccountData?.gc_account_id) {
        const { error: subscriptionError } = await supabase
          .from('account_subscriptions')
          .insert([
            {
              gc_account_id: gcAccountData.gc_account_id,
              tier_id: selectedTier,
              start_date: now.toISOString(),
              end_date: endDate.toISOString(),
              status: 'active'
            }
          ]);

        if (subscriptionError) {
          throw subscriptionError;
        }
      }

      toast({
        title: 'Success',
        description: 'Subscription selected successfully!'
      });

      // Navigate to the appropriate next step
      if (state.isNewUser) {
        navigate('/profile-completion');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error selecting subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to select subscription. Please try again.'
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {tiers.map((tier) => (
              <Card 
                key={tier.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  selectedTier === tier.id 
                    ? 'border-2 border-cnstrct-orange shadow-lg transform -translate-y-1' 
                    : 'border border-gray-200 hover:border-cnstrct-orange/50 hover:shadow-md'
                }`}
              >
                {selectedTier === tier.id && (
                  <div className="absolute top-0 right-0 bg-cnstrct-orange text-white px-3 py-1 text-sm font-medium">
                    Selected
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-cnstrct-navy">${tier.price}</span>
                    <span className="text-gray-500 ml-1">/month</span>
                  </div>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={selectedTier === tier.id ? "default" : "outline"}
                    className={`w-full ${
                      selectedTier === tier.id 
                        ? 'bg-gradient-to-r from-cnstrct-orange to-cnstrct-orange/90 text-white' 
                        : 'text-cnstrct-navy border-cnstrct-navy/50'
                    }`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    {selectedTier === tier.id ? 'Selected' : 'Select Plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cnstrct-orange to-cnstrct-orange/90 hover:from-cnstrct-orange/90 hover:to-cnstrct-orange text-white py-6 px-8 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all"
              onClick={handleContinue}
              disabled={!selectedTier || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue'
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
};

export default SubscriptionSelection;
