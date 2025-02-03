import { Button } from "@/components/ui/button";
import { Building, House } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Hero = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRegister = (type: "contractor" | "client") => {
    navigate("/auth");
  };

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
          {!user && (
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-cnstrct-orange hover:bg-cnstrct-orange/90"
                onClick={() => handleRegister("contractor")}
              >
                <Building className="mr-2 h-5 w-5" />
                Register as General Contractor
              </Button>
              <Button
                size="lg"
                className="bg-cnstrct-orange hover:bg-cnstrct-orange/90"
                onClick={() => handleRegister("client")}
              >
                <House className="mr-2 h-5 w-5" />
                Register as Client
              </Button>
            </div>
          )}
          {!user && (
            <p className="mt-6 text-sm text-gray-300">
              First time receiving an invoice? Register after your initial payment.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};