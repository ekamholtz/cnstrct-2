
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import ProfileCompletion from "@/pages/ProfileCompletion";
import Dashboard from "@/pages/Dashboard";
import GCProjects from "@/pages/GCProjects";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientProjectsPage from "@/pages/ClientProjectsPage";
import ClientInvoicesPage from "@/pages/ClientInvoicesPage";
import ClientInvoiceDashboard from "@/pages/ClientInvoiceDashboard";
import ProjectDashboard from "@/pages/ProjectDashboard";
import InvoiceDashboard from "@/pages/InvoiceDashboard";
import InvoiceDetails from "@/pages/InvoiceDetails";
import HomeownerProfile from "@/pages/HomeownerProfile";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminTransactions from "@/pages/AdminTransactions";
import AdminProjects from "@/pages/AdminProjects";
import ExpenseDashboard from "@/pages/ExpenseDashboard";
import ExpenseDetails from "@/pages/ExpenseDetails";
import PaymentDetails from "@/pages/PaymentDetails";
import PaymentsDashboard from "@/pages/PaymentsDashboard";
import Help from "@/pages/Help";
import ReportingDashboard from "@/pages/ReportingDashboard";
import QBOCallback from "@/pages/qbo/QBOCallback";
import Settings from "@/pages/Settings";
import QBOTest from "@/pages/QBOTest";
import CompanyDetailsPage from "@/pages/auth/CompanyDetailsPage";
import SubscriptionCheckout from "@/pages/SubscriptionCheckout";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import StripeConnectOnboarding from "@/pages/stripe/StripeConnectOnboarding";
import SubscriptionSelection from "@/pages/SubscriptionSelection";
import StripeCallback from "@/pages/StripeCallback";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/company-details" element={<CompanyDetailsPage />} />
      {/* Add route without hyphen to handle potential redirect issues */}
      <Route path="/auth/companydetails" element={<Navigate to="/auth/company-details" replace />} />
      {/* Subscription routes */}
      <Route path="/subscription-checkout" element={<SubscriptionCheckout />} />
      <Route path="/subscription-success" element={<SubscriptionSuccess />} />
      <Route path="/subscription-selection" element={<SubscriptionSelection />} />
      <Route path="/" element={<Index />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <AdminRoute>
            <AdminProjects />
          </AdminRoute>
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
        path="/client-dashboard"
        element={
          <ProtectedRoute>
            <ClientDashboard />
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
        path="/client-invoices"
        element={
          <ProtectedRoute>
            <ClientInvoicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDashboard />
          </ProtectedRoute>
        }
      />
      {/* For GC users */}
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <InvoiceDashboard />
          </ProtectedRoute>
        }
      />
      {/* For client/homeowner users */}
      <Route
        path="/invoice"
        element={
          <ProtectedRoute>
            <ClientInvoiceDashboard />
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
        path="/payments/:paymentId"
        element={
          <ProtectedRoute>
            <PaymentDetails />
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
        path="/reporting"
        element={
          <ProtectedRoute>
            <ReportingDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <Help />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <HomeownerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-completion"
        element={
          <ProtectedRoute>
            <ProfileCompletion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <AdminRoute>
            <AdminTransactions />
          </AdminRoute>
        }
      />
      <Route
        path="/qbo/callback"
        element={
          <ProtectedRoute>
            <QBOCallback />
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
        path="/stripe-connect-onboarding"
        element={
          <ProtectedRoute>
            <StripeConnectOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auth/stripe-callback"
        element={<StripeCallback />}
      />
      <Route
        path="/qbo-test"
        element={
          <ProtectedRoute>
            <QBOTest />
          </ProtectedRoute>
        }
      />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
