
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user);
      setUser(session?.user || null);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user state
      setUser(null);
      navigate("/");
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const navItems = user ? [
    { label: "Home", path: "/dashboard" },
    { label: "Projects", path: "/dashboard" },
    { label: "Invoices", path: "/invoices" },
    { label: "Profile", path: "/profile" },
  ] : [];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img
              src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
              alt="CNSTRCT Logo"
              className="h-8"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.path}
                className="text-cnstrct-navy hover:text-cnstrct-orange transition-colors"
              >
                {item.label}
              </a>
            ))}
            {user ? (
              <Button onClick={handleLogout} variant="outline">
                Sign Out
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Login
                </Button>
                <Button
                  className="bg-cnstrct-orange hover:bg-cnstrct-orange/90"
                  onClick={() => {
                    navigate("/auth");
                    setIsMenuOpen(false);
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="h-6 w-6 text-cnstrct-navy" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.path}
                  className="text-cnstrct-navy hover:text-cnstrct-orange transition-colors"
                >
                  {item.label}
                </a>
              ))}
              {user ? (
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  Sign Out
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate("/auth");
                      setIsMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full bg-cnstrct-orange hover:bg-cnstrct-orange/90"
                    onClick={() => {
                      navigate("/auth");
                      setIsMenuOpen(false);
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

