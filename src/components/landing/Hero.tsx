
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
    <section className="pt-32 pb-20 bg-gradient-to-br from-cnstrct-navy to-cnstrct-navy/90 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            Transform Your Construction <br />
            Payment Experience
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed">
            Streamline financial management with digitized workflows, automated invoicing, and real-time payments. Built specifically for construction professionals.
          </p>
          {!user && (
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="bg-cnstrct-orange hover:bg-cnstrct-orange/90 text-lg h-14 px-8"
                onClick={() => handleRegister("contractor")}
              >
                <Building className="mr-2 h-6 w-6" />
                Start as General Contractor
              </Button>
              <Button
                size="lg"
                className="bg-cnstrct-orange hover:bg-cnstrct-orange/90 text-lg h-14 px-8"
                onClick={() => handleRegister("client")}
              >
                <House className="mr-2 h-6 w-6" />
                Register as Homeowner
              </Button>
            </div>
          )}
          {!user && (
            <p className="mt-8 text-gray-300">
              Already managing projects? <Button variant="link" className="text-cnstrct-orange p-0 hover:text-cnstrct-orange/90" onClick={() => navigate("/auth")}>Sign in to your account</Button>
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
