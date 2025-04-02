import { useState, useEffect } from "react";
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
  Bell,
  ChevronDown,
  BarChart,
  Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface MainNavProps {
  /**
   * Whether to show settings in the main navigation bar
   */
  showSettingsInNav?: boolean;
  
  /**
   * Whether to show settings in the dropdown menu
   */
  showSettingsInDropdown?: boolean;
}

/**
 * Main navigation component for the application
 * Displays navigation items based on user role and provides access to user profile
 */
export function MainNav({ 
  showSettingsInNav = false, 
  showSettingsInDropdown = false 
}: MainNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data || { role: 'gc_admin', full_name: 'User' };
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
    try {
      console.log("MainNav - Navigating to:", path);
      console.log("MainNav - Current location:", location.pathname);
      console.log("MainNav - User role:", profile?.role);
      
      if (path === '/invoice' || path === '/invoices' || path === '/client-invoices') {
        console.log("MainNav - Invoice navigation triggered");
      }
      
      // Add a small delay to ensure state updates have completed
      setTimeout(() => {
        navigate(path);
        console.log("MainNav - Navigation completed to:", path);
      }, 0);
      
      setIsMenuOpen(false);
    } catch (error) {
      console.error("MainNav - Navigation error:", error);
    }
  };

  const homeRoute = profile?.role === 'platform_admin' ? '/admin' : 
                   profile?.role === 'homeowner' ? '/client-dashboard' : 
                   '/dashboard';

  const projectsRoute = profile?.role === 'homeowner' ? '/client-projects' : 
                       profile?.role === 'platform_admin' ? '/admin/projects' :
                       '/gc-projects';

  // Role-based invoice route
  const invoicesRoute = profile?.role === 'homeowner' ? '/client-invoices' : 
                       profile?.role === 'platform_admin' ? '/admin/invoices' :
                       '/invoices';

  const showReporting = profile?.role === 'gc_admin' || profile?.role === 'platform_admin';

  const baseNavItems = [
    { label: "Home", path: homeRoute, icon: Home },
    { label: "Projects", path: projectsRoute, icon: Grid },
    { label: "Invoices", path: invoicesRoute, icon: FileText },
    { label: "Expenses", path: "/expenses", icon: DollarSign },
    { label: "Payments", path: "/payments", icon: DollarSign },
    ...(showReporting ? [{ label: "Reports", path: "/reporting", icon: BarChart }] : []),
  ];
  
  // Add settings to nav items conditionally
  const navItems = showSettingsInNav 
    ? [...baseNavItems, { label: "Settings", path: "/settings", icon: Settings }]
    : baseNavItems;

  const isActive = (path: string) => {
    if (path === '/invoice' || path === '/invoices' || path === '/client-invoices') {
      return location.pathname === '/invoice' || location.pathname === '/invoices' || location.pathname === '/client-invoices';
    }
    return location.pathname === path;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-white shadow-premium' : 'bg-white'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={() => handleNavigation(homeRoute)}
              className="flex items-center mr-8"
            >
              <img
                src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
                alt="CNSTRCT Logo"
                className="h-8"
              />
            </button>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-cnstrct-navy/5 text-cnstrct-navy"
                        : "text-gray-600 hover:bg-cnstrct-navy/5 hover:text-cnstrct-navy"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-cnstrct-orange' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="relative p-2 rounded-full hover:bg-cnstrct-gray transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cnstrct-orange rounded-full"></span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-cnstrct-gray transition-colors">
                  <Avatar className="h-8 w-8 border border-cnstrct-grayDark">
                    <AvatarImage src="" alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="bg-cnstrct-navy text-white">
                      {getInitials(profile?.full_name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                {showSettingsInDropdown && (
                  <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleNavigation('/help')}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-cnstrct-navy focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-medium ${
                    active
                      ? "bg-cnstrct-navy/5 text-cnstrct-navy"
                      : "text-gray-600 hover:bg-cnstrct-navy/5 hover:text-cnstrct-navy"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-cnstrct-orange' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
