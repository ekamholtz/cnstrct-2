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
import ErrorBoundary from "@/components/ErrorBoundary";
import DebugPage from "@/pages/DebugPage";
import GCProjects from "@/pages/GCProjects";
import ClientDashboard from "@/pages/ClientDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import ClientProjectsPage from "@/pages/ClientProjectsPage";
import AdminProjects from "@/pages/AdminProjects";
import ClientInvoicesPage from "@/pages/ClientInvoicesPage";
import InvoiceDashboard from "@/pages/InvoiceDashboard";
import ExpenseDashboard from "@/pages/ExpenseDashboard";
import PaymentsDashboard from "@/pages/PaymentsDashboard";
import ReportingDashboard from "@/pages/ReportingDashboard";
import ProjectDashboard from "@/pages/ProjectDashboard";
import InvoiceDetails from "@/pages/InvoiceDetails";
import ExpenseDetails from "@/pages/ExpenseDetails";
import PaymentDetails from "@/pages/PaymentDetails";

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 bg-red-50 text-red-800 rounded-lg shadow-lg max-w-3xl mx-auto mt-10">
          <h2 className="text-2xl font-bold mb-4">Application Error</h2>
          <p className="mb-4">The application encountered an unexpected error. Please try refreshing the page.</p>
          <p className="text-sm opacity-80">If the problem persists, please contact support.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      }
    >
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
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/client-dashboard"
              element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
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
              path="/gc-projects"
              element={
                <ProtectedRoute>
                  <GCProjects />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/client-projects"
              element={
                <ProtectedRoute>
                  <ClientProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/projects"
              element={
                <ProtectedRoute>
                  <AdminProjects />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDashboard />
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
                  <InvoiceDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/client-invoices"
              element={
                <ProtectedRoute>
                  <ClientInvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/invoices"
              element={
                <ProtectedRoute>
                  <InvoiceDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/invoices/:invoiceId"
              element={
                <ProtectedRoute>
                  <InvoiceDetails />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/payment-success"
              element={
                <PaymentSuccess />
              }
            />
            <Route 
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpenseDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/expenses/:expenseId"
              element={
                <ProtectedRoute>
                  <ExpenseDetails />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/payments"
              element={
                <ProtectedRoute>
                  <PaymentsDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/payments/:paymentId"
              element={
                <ProtectedRoute>
                  <PaymentDetails />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/reporting"
              element={
                <ProtectedRoute>
                  <ReportingDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/debug"
              element={
                <DebugPage />
              }
            />
          </Routes>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
