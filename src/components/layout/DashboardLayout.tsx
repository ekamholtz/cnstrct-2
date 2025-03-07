
import { MainNav } from "@/components/navigation/MainNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-[#172b70] to-[#1e3a8a] text-white shadow-md">
        <MainNav />
      </div>
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="transition-all duration-300 ease-in-out">
          {children}
        </div>
      </main>
      <footer className="mt-auto py-4 text-center text-gray-400 text-xs">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} CNSTRCT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
