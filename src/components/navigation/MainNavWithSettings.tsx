
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function MainNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Projects",
      href: "/gc-projects",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Invoices",
      href: "/invoices",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Expenses",
      href: "/expenses",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: "Reporting",
      href: "/reporting",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 inset-x-0 z-30">
      <div className="container flex h-14 items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
                alt="CNSTRCT Logo"
                className="h-8"
              />
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center ml-10 space-x-4 lg:space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "text-sm transition-colors duration-200 flex items-center space-x-1",
                    isActive(item.href)
                      ? "text-cnstrct-navy font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {/* Desktop dropdown */}
            <div className="hidden md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.email || "My Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  isActive(item.href)
                    ? "bg-cnstrct-navy/5 text-cnstrct-navy"
                    : "text-gray-700 hover:bg-gray-100 hover:text-cnstrct-navy"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}

            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="mt-3 space-y-1">
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </div>
                </Link>
                <Link
                  to="/settings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </div>
                </Link>
                <button
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <LogOut className="h-5 w-5" />
                    <span>Log out</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
