import { Button } from "@/components/ui/button";
import { Building, House, ArrowRight, CheckCircle, UserPlus, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Hero() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(user);
      setSession(session);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setSession(session);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleRegister = (type: "contractor" | "client") => {
    navigate("/auth");
  };

  const features = [
    "Streamlined payment processing",
    "Real-time project tracking",
    "Secure document sharing",
    "Automated milestone notifications"
  ];

  return (
    <div className="relative isolate overflow-hidden bg-cnstrct-navy bg-grid-white">
      {/* Gradient background elements */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-cnstrct-orange to-cnstrct-orangeLight opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
      
      <div className="absolute inset-x-0 -bottom-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-bottom-80" aria-hidden="true">
        <div className="relative left-[calc(50%+11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-cnstrct-orange to-cnstrct-orangeLight opacity-20 sm:left-[calc(50%+30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
      
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
          <div className="flex">
            <div className="relative flex items-center gap-x-2 rounded-full px-4 py-1 text-sm leading-6 text-white ring-1 ring-cnstrct-orange/20 hover:ring-cnstrct-orange/40">
              <span className="font-semibold text-cnstrct-orange">New</span>
              <span className="h-0.5 w-0.5 rounded-full bg-white/40"></span>
              <a href="#pricing" className="flex items-center gap-x-1 text-white">
                <span className="absolute inset-0" aria-hidden="true"></span>
                See our pricing plans
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          <h1 className="mt-10 max-w-lg text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Simplify Your Construction Projects
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-white/80">
            CNSTRCT streamlines communication between homeowners and contractors, making project management and payments seamless and transparent.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-x-2 text-white/80">
                <CheckCircle className="h-5 w-5 flex-none text-cnstrct-orange" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          
          {user ? (
            <div className="mt-10 flex items-center gap-x-6">
              <Button
                size="lg"
                className="bg-cnstrct-orange text-white hover:bg-cnstrct-orange/90 text-lg h-14 px-8 rounded-xl"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className="mr-2 h-6 w-6" />
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="mt-10 flex items-center gap-x-6">
              <Button
                size="lg"
                className="bg-cnstrct-orange text-white hover:bg-cnstrct-orange/90 text-lg h-14 px-8 rounded-xl"
                onClick={() => navigate("/auth")}
              >
                <UserPlus className="mr-2 h-6 w-6" />
                Get Started
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 lg:flex-grow">
          <div className="relative mx-auto overflow-hidden rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl sm:mx-0 p-8 w-full max-w-md">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-cnstrct-orange/20 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-cnstrct-orange/20 blur-3xl" />
            
            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-cnstrct-orange"></div>
                  <span className="text-white font-medium">Payment Dashboard</span>
                </div>
                <div className="flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-white/20"></div>
                  <div className="h-2 w-2 rounded-full bg-white/20"></div>
                  <div className="h-2 w-2 rounded-full bg-white/20"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Mock dashboard UI elements */}
                <div className="h-16 rounded-lg bg-white/10 flex items-center px-4">
                  <div className="w-10 h-10 rounded-md bg-cnstrct-orange/20 flex items-center justify-center">
                    <Building className="h-5 w-5 text-cnstrct-orange" />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="h-2.5 w-24 bg-white/30 rounded-full"></div>
                    <div className="mt-1.5 h-2 w-16 bg-white/20 rounded-full"></div>
                  </div>
                  <div className="h-8 w-20 rounded-md bg-cnstrct-orange/20 flex items-center justify-center">
                    <span className="text-xs text-cnstrct-orange font-medium">$12,450</span>
                  </div>
                </div>
                
                <div className="h-16 rounded-lg bg-white/10 flex items-center px-4">
                  <div className="w-10 h-10 rounded-md bg-cnstrct-orange/20 flex items-center justify-center">
                    <House className="h-5 w-5 text-cnstrct-orange" />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="h-2.5 w-32 bg-white/30 rounded-full"></div>
                    <div className="mt-1.5 h-2 w-20 bg-white/20 rounded-full"></div>
                  </div>
                  <div className="h-8 w-20 rounded-md bg-cnstrct-orange/20 flex items-center justify-center">
                    <span className="text-xs text-cnstrct-orange font-medium">$8,320</span>
                  </div>
                </div>
                
                <div className="h-16 rounded-lg bg-white/10 flex items-center px-4">
                  <div className="w-10 h-10 rounded-md bg-cnstrct-orange/20 flex items-center justify-center">
                    <Building className="h-5 w-5 text-cnstrct-orange" />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="h-2.5 w-28 bg-white/30 rounded-full"></div>
                    <div className="mt-1.5 h-2 w-14 bg-white/20 rounded-full"></div>
                  </div>
                  <div className="h-8 w-20 rounded-md bg-cnstrct-orange/20 flex items-center justify-center">
                    <span className="text-xs text-cnstrct-orange font-medium">$5,780</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 h-10 rounded-lg bg-cnstrct-orange/20 flex items-center justify-center">
                <span className="text-sm text-cnstrct-orange font-medium">Total: $26,550</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
