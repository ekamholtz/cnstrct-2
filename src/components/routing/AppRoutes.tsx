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

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
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
        path="/project/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDashboard />
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
      <Route path="/landing" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
