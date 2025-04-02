
import { useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export const SubscriptionSettings = () => {
  const { 
    subscription, 
    isLoading, 
    cancelSubscription, 
    resumeSubscription,
    createPortalSession
  } = useSubscription();

  // Load the Stripe Pricing Table script
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
  }, []);

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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select a Subscription Plan</CardTitle>
              <CardDescription>
                Choose the plan that best fits your business needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <stripe-pricing-table 
                pricing-table-id="prctbl_1R9UC0Apu80f9E3HqRPNRBtK"
                publishable-key="pk_test_51QzjhnApu80f9E3HjlgkmHwM1a4krzjoz0sJlsz41wIhMYIr1sst6sx2mCZ037PiY2UE6xfNA5zzkxCQwOAJ4yoD00gm7TIByL">
              </stripe-pricing-table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
