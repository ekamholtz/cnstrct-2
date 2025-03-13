
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export const SubscriptionSettings = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { 
    subscription, 
    plans,
    isLoading, 
    createCheckoutSession, 
    cancelSubscription, 
    resumeSubscription,
    createPortalSession
  } = useSubscription();
  const { toast } = useToast();

  // When plans load, pre-select the first one if none is selected
  useEffect(() => {
    if (plans?.length && !selectedPlan) {
      setSelectedPlan(plans[0].id);
    }
  }, [plans, selectedPlan]);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast({
        variant: "destructive",
        title: "Please select a plan",
        description: "You must select a subscription plan to continue.",
      });
      return;
    }
    
    await createCheckoutSession(selectedPlan);
  };

  const handleCancel = async () => {
    if (!subscription?.id) return;
    
    cancelSubscription.mutate(subscription.id);
  };

  const handleResume = async () => {
    if (!subscription?.id) return;
    
    resumeSubscription.mutate(subscription.id);
  };

  const handleManageSubscription = async () => {
    await createPortalSession();
  };

  const getStatusBadge = () => {
    if (!subscription) return null;
    
    switch (subscription.status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "canceled":
        return <Badge className="bg-yellow-100 text-yellow-800">Canceled</Badge>;
      case "past_due":
        return <Badge className="bg-red-100 text-red-800">Past Due</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{subscription.status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle case where no plans are returned from Stripe
  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            No subscription plans available at this time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please contact support to set up subscription plans in your Stripe account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {subscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Subscription</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription>
              Manage your current subscription settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan</p>
                <p className="text-lg font-semibold">{subscription.plan_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-lg font-semibold">{subscription.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Period Ends</p>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {format(new Date(subscription.current_period_end * 1000), "PPP")}
                  </p>
                </div>
              </div>
              {subscription.cancel_at_period_end && (
                <div>
                  <p className="text-sm font-medium text-red-500">Cancels at period end</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
              
              {subscription.cancel_at_period_end ? (
                <Button 
                  variant="outline" 
                  onClick={handleResume}
                  disabled={resumeSubscription.isPending}
                >
                  {resumeSubscription.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Resume Subscription
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={cancelSubscription.isPending}
                >
                  {cancelSubscription.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select a Subscription Plan</CardTitle>
            <CardDescription>
              Choose the plan that best fits your business needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedPlan || ""} onValueChange={setSelectedPlan} className="space-y-4">
              {plans.map(plan => (
                <div 
                  key={plan.id}
                  className={`flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 cursor-pointer ${
                    plan.popular ? 'border-cnstrct-orange' : ''
                  }`}
                >
                  <RadioGroupItem value={plan.id} id={plan.id} />
                  <div className="grid gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={plan.id} className="font-medium cursor-pointer">
                        {plan.name} - ${plan.price}/{plan.interval}
                      </Label>
                      {plan.popular && (
                        <Badge className="bg-cnstrct-orange text-white">Most Popular</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    {plan.features && plan.features.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-green-500">✓</span> {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
            
            <Button 
              onClick={handleSubscribe} 
              disabled={!selectedPlan || isLoading}
              className="w-full md:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subscribe Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
