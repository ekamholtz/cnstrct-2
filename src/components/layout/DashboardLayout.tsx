
import { MainNav } from "@/components/navigation/MainNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <MainNav />
      </div>
      <main className="container mx-auto px-4 py-6 mt-4 max-w-7xl">
        <div className="transition-all duration-300 ease-in-out animate-fadeIn">
          {children}
        </div>
      </main>
      <footer className="mt-auto py-4 text-center text-gray-500 text-xs">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} CNSTRCT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
