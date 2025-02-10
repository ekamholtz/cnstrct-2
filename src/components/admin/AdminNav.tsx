
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Receipt } from "lucide-react";

export const AdminNav = () => {
  const location = useLocation();
  
  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users
    },
    {
      title: "Transactions",
      href: "/admin/transactions",
      icon: Receipt
    }
  ];

  return (
    <nav className="flex space-x-4 px-4 py-2 bg-white border-b">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
};
