
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

export function MainNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Fetch user role from profiles table
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      console.log('Current user role:', data.role); // Debug log
      return data;
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

  const homeRoute = profile?.role === 'admin' ? '/admin' : 
                   profile?.role === 'homeowner' ? '/client-dashboard' : 
                   '/dashboard';

  const projectsRoute = profile?.role === 'homeowner' ? '/client-projects' : 
                       profile?.role === 'admin' ? '/admin/projects' :
                       '/gc-projects';

  // Customize nav items based on user role
  const getNavItems = () => {
    const baseItems = [
      { label: "Home", path: homeRoute, icon: Home },
    ];

    if (profile?.role === 'admin') {
      return [
        ...baseItems,
        { label: "Users", path: "/admin/users", icon: Users },
      ];
    }

    return [
      ...baseItems,
      { label: "Projects", path: projectsRoute, icon: Grid },
      { label: "Invoices", path: "/invoices", icon: FileText },
      { label: "Profile", path: "/profile", icon: User },
      { label: "Help", path: "/help", icon: HelpCircle },
    ];
  };

  const navItems = getNavItems();
  const isActive = (path: string) => location.pathname === path;

  // If user is on wrong projects page, redirect them
  if (location.pathname === '/gc-projects' && profile?.role === 'homeowner') {
    navigate('/client-projects');
    return null;
  }

  if (location.pathname === '/client-projects' && profile?.role === 'general_contractor') {
    navigate('/gc-projects');
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={homeRoute} className="flex items-center">
            <img
              src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
              alt="CNSTRCT Logo"
              className="h-8"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-cnstrct-orange"
                      : "text-gray-600 hover:text-cnstrct-orange"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
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

          {/* Mobile Menu Button */}
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

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "text-cnstrct-orange"
                        : "text-gray-600 hover:text-cnstrct-orange"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
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
