
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCheckoutSession, isLoading } = useSubscription();

  const plans = [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for small contractors and individual projects",
      price: "$49",
      period: "per month",
      features: [
        "Up to 5 active projects",
        "Basic invoicing",
        "Email support",
        "Mobile app access",
        "1 team member"
      ],
      popular: false,
      buttonText: "Get Started",
      buttonVariant: "outline"
    },
    {
      id: "professional",
      name: "Professional",
      description: "Ideal for growing construction businesses",
      price: "$99",
      period: "per month",
      features: [
        "Up to 20 active projects",
        "Advanced invoicing & payments",
        "Priority email & chat support",
        "Mobile app access",
        "5 team members",
        "Financial reporting",
        "Client portal"
      ],
      popular: true,
      buttonText: "Get Started",
      buttonVariant: "default"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large construction companies with complex needs",
      price: "$249",
      period: "per month",
      features: [
        "Unlimited projects",
        "Complete payment suite",
        "24/7 phone, email & chat support",
        "Mobile app access",
        "Unlimited team members",
        "Advanced analytics",
        "Client portal",
        "Custom integrations",
        "Dedicated account manager"
      ],
      popular: false,
      buttonText: "Contact Sales",
      buttonVariant: "outline"
    }
  ];

  const handlePlanSelect = async (planId: string, contactSales: boolean = false) => {
    if (contactSales) {
      // Redirect to contact page or open contact form
      navigate("/#contact");
      return;
    }

    if (!user) {
      // Not logged in, redirect to auth page
      navigate("/auth", { state: { selectedPlan: planId } });
      return;
    }

    // User is logged in, start subscription process
    await createCheckoutSession(planId);
  };

  return (
    <section id="pricing" className="py-32 bg-cnstrct-gray">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-cnstrct-navy/5 text-cnstrct-navy text-sm font-medium">
            <span>Pricing</span>
          </div>
          <h2 className="text-4xl font-bold text-cnstrct-navy mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 text-lg">
            Choose the plan that best fits your business needs. All plans include our core features with varying levels of support and capabilities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative rounded-2xl p-8 ${
                plan.popular 
                  ? 'bg-gradient-to-br from-cnstrct-navy to-cnstrct-navyLight text-white shadow-xl border-2 border-cnstrct-orange' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cnstrct-orange text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-cnstrct-navy'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/80' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-cnstrct-navy'}`}>
                    {plan.price}
                  </span>
                  <span className={`ml-2 text-sm ${plan.popular ? 'text-white/80' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-cnstrct-orange' : 'text-cnstrct-orange'}`} />
                    <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-gray-700'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-cnstrct-orange hover:bg-cnstrct-orangeLight text-white' 
                    : 'border-cnstrct-navy text-cnstrct-navy hover:bg-cnstrct-navy hover:text-white'
                }`}
                variant={plan.buttonVariant === "outline" ? "outline" : "default"}
                disabled={isLoading}
                onClick={() => handlePlanSelect(plan.id, plan.buttonText === "Contact Sales")}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center text-gray-500 text-sm">
          Need a custom solution? <a href="#contact" className="text-cnstrct-navy font-medium hover:text-cnstrct-orange">Contact our sales team</a>
        </div>
      </div>
    </section>
  );
};
