import { Building2, CreditCard, MessageSquare, ChartBar, ArrowDownToLine, CheckCircle, ArrowRight } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Features() {
  const [isHovered, setIsHovered] = useState<number | null>(null);

  const features = [
    {
      icon: Building2,
      title: "Project Management",
      description: "Track project progress, milestones, and deadlines in real-time with our intuitive dashboard.",
      benefits: ["Centralized project tracking", "Milestone management", "Team collaboration"]
    },
    {
      icon: CreditCard,
      title: "Automated Invoicing",
      description: "Generate and process invoices automatically, streamlining your payment workflows.",
      benefits: ["Recurring invoices", "Payment reminders", "Digital record keeping"]
    },
    {
      icon: ArrowDownToLine,
      title: "Flexible Vendor Payments",
      description: "Send payments via email or text. Vendors choose their preferred method: ACH, instant card transfer, or printable check.",
      benefits: ["Multiple payment options", "Instant transfers", "Secure transactions"]
    },
    {
      icon: MessageSquare,
      title: "Real-time Communication",
      description: "Stay connected with instant notifications and messaging for seamless collaboration.",
      benefits: ["In-app messaging", "Email notifications", "Document sharing"]
    },
    {
      icon: ChartBar,
      title: "Financial Analytics",
      description: "Get detailed insights into your project finances with comprehensive reporting tools.",
      benefits: ["Expense tracking", "Budget analysis", "Custom reports"]
    },
  ];

  return (
    <section id="features" className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4 mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-cnstrct-navy/5 text-cnstrct-navy text-sm font-medium">
            <span>Features</span>
          </div>
          <h2 className="text-4xl font-bold text-cnstrct-navy mb-6">
            Powerful Tools for Construction Management
          </h2>
          <p className="text-gray-600 text-lg">
            Our platform provides everything you need to manage construction projects efficiently,
            from tracking progress to processing payments.
          </p>
        </div>
      </div>

      {/* Marquee scrolling features */}
      <div className="py-8 bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <Marquee direction="left" speed={25} className="py-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative w-[350px] p-8 mx-6 rounded-2xl border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-2"
              onMouseEnter={() => setIsHovered(index)}
              onMouseLeave={() => setIsHovered(null)}
            >
              {/* Decorative elements */}
              <div className={`absolute top-0 ${index % 2 === 0 ? 'left-0 rounded-br-[100px]' : 'right-0 rounded-bl-[100px]'} w-32 h-32 bg-cnstrct-orange/5 -z-10`}></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-cnstrct-navy/5 rounded-tl-[80px] -z-10"></div>
              
              {/* Icon */}
              <div className={`w-16 h-16 flex items-center justify-center rounded-xl ${
                index % 2 === 0 
                ? 'bg-gradient-to-br from-cnstrct-orange to-cnstrct-orangeLight' 
                : 'bg-gradient-to-br from-cnstrct-navy to-cnstrct-navyLight'
              } text-white mb-6 shadow-md`}>
                <feature.icon className="h-8 w-8" />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-cnstrct-navy mb-4 group-hover:text-cnstrct-orange transition-colors">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-6 text-base">
                {feature.description}
              </p>
              
              {/* Benefits */}
              <div className="space-y-3">
                {feature.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className={`h-5 w-5 ${index % 2 === 0 ? 'text-cnstrct-navy' : 'text-cnstrct-orange'} mt-0.5 flex-shrink-0`} />
                    <span className="text-sm font-medium text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Learn more button */}
              <div className={`mt-8 transition-all duration-300 ${isHovered === index ? 'opacity-100' : 'opacity-0'}`}>
                <Button 
                  variant="ghost" 
                  className={`${index % 2 === 0 ? 'text-cnstrct-orange hover:text-cnstrct-orange/80' : 'text-cnstrct-navy hover:text-cnstrct-navy/80'} p-0 hover:bg-transparent`}
                >
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
