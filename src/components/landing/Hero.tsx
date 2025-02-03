import { Button } from "@/components/ui/button";
import { Building, DollarSign } from "lucide-react";

export const Hero = () => {
  return (
    <section className="pt-24 pb-16 bg-gradient-to-br from-cnstrct-navy to-cnstrct-navy/90 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Streamline Your Construction Projects
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Simplify financial management with digitized workflows, invoicing, and real-time payments.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-cnstrct-orange hover:bg-cnstrct-orange/90"
            >
              <Building className="mr-2 h-5 w-5" />
              Register as General Contractor
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white/10"
            >
              <DollarSign className="mr-2 h-5 w-5" />
              Register as Client
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-300">
            First time receiving an invoice? Register after your initial payment.
          </p>
        </div>
      </div>
    </section>
  );
};