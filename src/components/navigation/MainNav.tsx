
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  FileText,
  User,
  Users,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Grid,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

export function MainNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      console.log('Current user role:', data?.role);
      return data || { role: 'gc_admin' };
    },
  });

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  const handleNavigation = (path: string) => {
    console.log("Navigating to:", path);
    navigate(path);
    setIsMenuOpen(false);
  };

  const homeRoute = profile?.role === 'platform_admin' ? '/admin' : 
                   profile?.role === 'homeowner' ? '/client-dashboard' : 
                   '/dashboard';

  const projectsRoute = profile?.role === 'homeowner' ? '/client-projects' : 
                       profile?.role === 'platform_admin' ? '/admin/projects' :
                       '/gc-projects';

  const invoicesRoute = profile?.role === 'homeowner' ? '/client-invoices' : '/invoice';

  const navItems = [
    { label: "Home", path: homeRoute, icon: Home },
    { label: "Projects", path: projectsRoute, icon: Grid },
    { label: "Invoices", path: invoicesRoute, icon: FileText },
    { label: "Expenses", path: "/expenses", icon: DollarSign },
    { label: "Payments", path: "/payments", icon: DollarSign },
    { label: "Profile", path: "/profile", icon: User },
    { label: "Help", path: "/help", icon: HelpCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => handleNavigation(homeRoute)}
            className="flex items-center"
          >
            <img
              src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
              alt="CNSTRCT Logo"
              className="h-8"
            />
          </button>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-cnstrct-orange"
                      : "text-gray-600 hover:text-cnstrct-orange"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "text-cnstrct-orange"
                        : "text-gray-600 hover:text-cnstrct-orange"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-red-600 w-full justify-start px-4"
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
