
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { ProtectedRouteWithSettings } from "./ProtectedRouteWithSettings";
import { AdminRoute } from "./AdminRoute";
import { LoadingSpinner } from "@/components/project/dashboard/LoadingSpinner";

// Lazy-loaded components for improved performance
const Landing = lazy(() => import("@/pages/Landing"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ClientDashboard = lazy(() => import("@/pages/client/ClientDashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const ProfileCompletion = lazy(() => import("@/pages/ProfileCompletion"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const Projects = lazy(() => import("@/pages/Projects"));
const ProjectDetails = lazy(() => import("@/pages/ProjectDetails"));
const ProjectEdit = lazy(() => import("@/pages/ProjectEdit"));
const ClientProjects = lazy(() => import("@/pages/client/ClientProjects"));
const AdminProjects = lazy(() => import("@/pages/admin/AdminProjects"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const ProjectExpenses = lazy(() => import("@/pages/ProjectExpenses"));
const ExpenseCreate = lazy(() => import("@/pages/ExpenseCreate"));
const ExpenseEdit = lazy(() => import("@/pages/ExpenseEdit"));
const AdminTransactions = lazy(() => import("@/pages/admin/AdminTransactions"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const ClientInvoices = lazy(() => import("@/pages/client/ClientInvoices"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const InvoiceDetails = lazy(() => import("@/pages/InvoiceDetails"));
const Settings = lazy(() => import("@/pages/Settings"));
const PaymentSettings = lazy(() => import("@/pages/settings/PaymentSettings"));
const Help = lazy(() => import("@/pages/Help"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Payments = lazy(() => import("@/pages/Payments"));
const Reporting = lazy(() => import("@/pages/Reporting"));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile-completion" element={<ProfileCompletion />} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/gc-projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/project/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
        <Route path="/project/:id/edit" element={<ProtectedRoute><ProjectEdit /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/project/:id/expenses" element={<ProtectedRoute><ProjectExpenses /></ProtectedRoute>} />
        <Route path="/expense/create" element={<ProtectedRoute><ExpenseCreate /></ProtectedRoute>} />
        <Route path="/expense/:id/edit" element={<ProtectedRoute><ExpenseEdit /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/invoice/:id" element={<ProtectedRoute><InvoiceDetails /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/payments" element={<ProtectedRoute><PaymentSettings /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/reporting" element={<ProtectedRoute><Reporting /></ProtectedRoute>} />
        
        {/* Client routes */}
        <Route path="/client-dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/client-projects" element={<ProtectedRoute><ClientProjects /></ProtectedRoute>} />
        <Route path="/client-invoices" element={<ProtectedRoute><ClientInvoices /></ProtectedRoute>} />
        
        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/projects" element={<AdminRoute><AdminProjects /></AdminRoute>} />
        <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        
        {/* Fallback route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
