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
import ClientInvoiceDashboard from "@/pages/ClientInvoiceDashboard"; // Support both implementations
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
import QBOCallback from "@/pages/qbo/QBOCallbackFinal";
import Settings from "@/pages/Settings";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
// Import Stripe Connect components
import StripeConnectOnboarding from "@/pages/stripe/StripeConnectOnboarding";
import StripeOnboardingComplete from "../../pages/stripe/StripeOnboardingComplete";
import CreatePaymentLink from "@/pages/stripe/CreatePaymentLink";
import PaymentHistory from "@/pages/stripe/PaymentHistory";
import PaymentSettings from "@/pages/settings/PaymentSettings";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
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
      {/* Stripe Connect Routes */}
      <Route
        path="/settings/payments"
        element={
          <ProtectedRoute>
            <PaymentSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stripe/create-payment"
        element={
          <ProtectedRoute>
            <CreatePaymentLink />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stripe/payment-history"
        element={
          <ProtectedRoute>
            <PaymentHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stripe/onboarding"
        element={
          <ProtectedRoute>
            <StripeConnectOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stripe/onboarding-complete"
        element={
          <ProtectedRoute>
            <StripeOnboardingComplete />
          </ProtectedRoute>
        }
      />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
