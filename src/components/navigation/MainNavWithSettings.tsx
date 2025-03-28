
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const MainNav = ({ className }: { className?: string }) => {
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Projects",
      href: "/projects",
    },
    {
      title: "Invoices",
      href: "/invoices",
    },
    {
      title: "Clients",
      href: "/clients",
    },
    {
      title: "Settings",
      href: "/settings",
    },
  ];

  return (
    <nav
      className={cn(
        "flex items-center space-x-4 lg:space-x-6 bg-white p-4 border-b",
        className
      )}
    >
      <Link to="/" className="flex items-center space-x-2">
        <span className="font-bold text-xl">CNSTRCT</span>
      </Link>
      
      <div className="mx-6">
        <div className="flex items-center space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="ml-auto flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          Help
        </Button>
        <Button variant="ghost" size="sm">
          Account
        </Button>
      </div>
    </nav>
  );
};
