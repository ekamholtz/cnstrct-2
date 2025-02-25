
import { MainNav } from "@/components/navigation/MainNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <main className="container mx-auto px-4 py-8 mt-16">
        {children}
      </main>
    </div>
  );
}
