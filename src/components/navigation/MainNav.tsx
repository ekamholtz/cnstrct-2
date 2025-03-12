
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

export function MainNav() {
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
    console.log("MainNav - Navigating to:", path);
    if (path === '/invoice' || path === '/invoices' || path === '/client-invoices') {
      console.log("MainNav - Invoice navigation triggered");
    }
    navigate(path);
    setIsMenuOpen(false);
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

  const navItems = [
    { label: "Home", path: homeRoute, icon: Home },
    { label: "Projects", path: projectsRoute, icon: Grid },
    { label: "Invoices", path: invoicesRoute, icon: FileText },
    { label: "Expenses", path: "/expenses", icon: DollarSign },
    { label: "Payments", path: "/payments", icon: DollarSign },
    ...(showReporting ? [{ label: "Reports", path: "/reporting", icon: BarChart }] : []),
  ];

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
                <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/help')}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <button
            className="md:hidden p-2 rounded-md hover:bg-cnstrct-gray transition-colors"
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
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
                onClick={() => handleNavigation('/profile')}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-cnstrct-navy/5 hover:text-cnstrct-navy"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => handleNavigation('/settings')}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-cnstrct-navy/5 hover:text-cnstrct-navy"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => handleNavigation('/help')}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-cnstrct-navy/5 hover:text-cnstrct-navy"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </button>
              <button
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-red-600 hover:bg-red-50"
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
