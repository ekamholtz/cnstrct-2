
export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-cnstrct-navy mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the plan that best fits your business needs. All plans include our core features with varying levels of support and capabilities.
          </p>
        </div>
        
        {/* Stripe Pricing Table */}
        <div className="max-w-4xl mx-auto">
          <stripe-pricing-table 
            pricing-table-id="prctbl_1QufbmB6ZT5p58PjIyoPRLuU"
            publishable-key="pk_test_51QrkC5B6ZT5p58PjRIYS2eXGuSlAIXB1Xrj43MRR7jr45pisio0RBkbXyLKnRZ7TPf87mXewJK1WlTz25CINPe81008rN4sOj0">
          </stripe-pricing-table>
        </div>
      </div>
    </section>
  );
};
