
import { Building2, CreditCard, MessageSquare, ChartBar, ArrowDownToLine } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Building2,
      title: "Project Management",
      description: "Track project progress, milestones, and deadlines in real-time with our intuitive dashboard.",
    },
    {
      icon: CreditCard,
      title: "Automated Invoicing",
      description: "Generate and process invoices automatically, streamlining your payment workflows.",
    },
    {
      icon: ArrowDownToLine,
      title: "Flexible Vendor Payments",
      description: "Send payments via email or text. Vendors choose their preferred method: ACH, instant card transfer, or printable check.",
    },
    {
      icon: MessageSquare,
      title: "Real-time Communication",
      description: "Stay connected with instant notifications and messaging for seamless collaboration.",
    },
    {
      icon: ChartBar,
      title: "Financial Analytics",
      description: "Get detailed insights into your project finances with comprehensive reporting tools.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-cnstrct-gray overflow-x-auto">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-cnstrct-navy mb-4">
            Powerful Features for Construction Management
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our platform provides everything you need to manage construction projects efficiently,
            from tracking progress to processing payments.
          </p>
        </div>

        <div className="flex flex-nowrap gap-6 min-w-full md:justify-center">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex-none w-72"
            >
              <feature.icon className="h-12 w-12 text-cnstrct-orange mb-4" />
              <h3 className="text-xl font-semibold text-cnstrct-navy mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
