
import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Settings from "@/pages/Settings";
import Projects from "@/pages/Projects";
import Project from "@/pages/Project";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NewProject from "@/pages/NewProject";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from '@/components/ui/toaster'
import NewClient from "@/pages/NewClient";
import Clients from "@/pages/Clients";
import Client from "@/pages/Client";
import Invoice from "@/pages/Invoice";
import Invoices from "@/pages/Invoices";
import { QBOCallback } from "@/pages/QBOCallback";
import PaymentCallback from "@/pages/PaymentCallback";
import PaymentsSettings from "@/pages/PaymentsSettings";
import PaymentSuccess from "@/pages/PaymentSuccess";

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/qbo/callback" element={<QBOCallback />} />
          <Route 
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/settings/payments"
            element={
              <ProtectedRoute>
                <PaymentsSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/payments/callback"
            element={<PaymentCallback />}
          />
          <Route 
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <Project />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/projects/new"
            element={
              <ProtectedRoute>
                <NewProject />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/clients"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/clients/:id"
            element={
              <ProtectedRoute>
                <Client />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/clients/new"
            element={
              <ProtectedRoute>
                <NewClient />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/invoices"
            element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/invoices/:id"
            element={
              <ProtectedRoute>
                <Invoice />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/payment-success"
            element={
              <PaymentSuccess />
            }
          />
        </Routes>
        <Toaster />
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
