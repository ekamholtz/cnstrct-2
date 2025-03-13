
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Pricing = () => {
  const { user } = useAuth();

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
        
        <div className="max-w-5xl mx-auto">
          <stripe-pricing-table 
            pricing-table-id="prctbl_1R2HRTApu80f9E3HqCXBahYx"
            publishable-key="pk_live_51QzjhnApu80f9E3HQcOCt84dyoMh2k9e4QlmNR7a11j9ddZcjrPOqIfi1S1J47tgRTKFaDD3cL3odKRaNya6PIny00BA5N7LnX">
          </stripe-pricing-table>
        </div>
        
        <div className="mt-12 text-center text-gray-500 text-sm">
          Need a custom solution? <a href="#contact" className="text-cnstrct-navy font-medium hover:text-cnstrct-orange">Contact our sales team</a>
        </div>
      </div>
    </section>
  );
};
