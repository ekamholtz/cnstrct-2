import React from "react";
import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/layout/Footer";

interface StandardLayoutProps {
  children: React.ReactNode;
}

export function StandardLayout({ children }: StandardLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <MainNav showSettingsInDropdown={true} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
