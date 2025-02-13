
import { MainNav } from "@/components/navigation/MainNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto px-4 py-8 mt-24">
        {children}
      </main>
    </div>
  );
}
