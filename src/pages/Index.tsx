
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { Building, House } from "lucide-react";
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    // Load Stripe Pricing Table script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HeroSection
          badge={{
            text: "New Feature",
            action: {
              text: "Instant Payments",
              href: "#features",
            },
          }}
          title="Transform Your Construction Payment Experience"
          description="Streamline financial management with digitized workflows, automated invoicing, and real-time payments. Built specifically for construction professionals."
          actions={[
            {
              text: "Start as General Contractor",
              href: "/auth",
              variant: "default",
              icon: <Building className="h-6 w-6" />,
            },
            {
              text: "Register as Homeowner",
              href: "/auth",
              variant: "outline",
              icon: <House className="h-6 w-6" />,
            },
          ]}
          image={{
            src: "/lovable-uploads/9021191a-43ec-41eb-b28c-4082d44cd9ff.png",
            alt: "Construction payment platform dashboard",
          }}
        />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
