
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold">CNSTRCT</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="text-sm">{user.email}</div>
            ) : (
              <Link to="/auth" className="text-sm">Sign in</Link>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4 hidden md:block">
          <nav className="space-y-2">
            <Link to="/" className="block py-2 px-3 rounded hover:bg-gray-100">Dashboard</Link>
            <Link to="/projects" className="block py-2 px-3 rounded hover:bg-gray-100">Projects</Link>
            <Link to="/clients" className="block py-2 px-3 rounded hover:bg-gray-100">Clients</Link>
            <Link to="/invoices" className="block py-2 px-3 rounded hover:bg-gray-100">Invoices</Link>
            <Link to="/settings" className="block py-2 px-3 rounded hover:bg-gray-100">Settings</Link>
          </nav>
        </aside>
        
        {/* Content area */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};
