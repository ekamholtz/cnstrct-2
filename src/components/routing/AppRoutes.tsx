
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { LoadingSpinner } from "@/components/project/dashboard/LoadingSpinner";

// Use only the components that exist in the project
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ProfileCompletion = lazy(() => import("@/pages/ProfileCompletion"));
const Settings = lazy(() => import("@/pages/Settings"));
const PaymentSettings = lazy(() => import("@/pages/settings/PaymentSettings"));
const Help = lazy(() => import("@/pages/Help"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const HomeownerProfile = lazy(() => import("@/pages/HomeownerProfile"));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile-completion" element={<ProfileCompletion />} />
        <Route path="/profile" element={<ProtectedRoute><HomeownerProfile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/payments" element={<ProtectedRoute><PaymentSettings /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        
        {/* Fallback route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
