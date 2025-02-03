import { Building, DollarSign, Bell, ChartBar } from "lucide-react";

const features = [
  {
    icon: Building,
    title: "Project Tracking",
    description: "Monitor milestones and progress in real-time with our intuitive dashboard.",
  },
  {
    icon: DollarSign,
    title: "Automated Invoicing",
    description: "Generate and process invoices automatically, saving time and reducing errors.",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description: "Stay updated with instant alerts for payments, approvals, and project updates.",
  },
  {
    icon: ChartBar,
    title: "Financial Analytics",
    description: "Track project finances with detailed reports and insights.",
  },
];

export const Features = () => {
  return (
    <section className="py-16 bg-cnstrct-gray">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-cnstrct-navy">
          Powerful Features for Construction Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <feature.icon className="h-10 w-10 text-cnstrct-orange mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-cnstrct-navy">
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