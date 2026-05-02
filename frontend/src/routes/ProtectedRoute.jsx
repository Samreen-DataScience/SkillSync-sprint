import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

export function ProtectedRoute({ allowedRoles = [] }) {
  const { token, hasRole, clearAuth } = useAuthStore();

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  if (token === "local-login-token") {
    clearAuth();
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    // Redirect to their default dashboard if they lack the correct role
    if (hasRole(["ROLE_ADMIN"])) return <Navigate to="/admin/dashboard" replace />;
    if (hasRole(["ROLE_MENTOR"])) return <Navigate to="/mentor/dashboard" replace />;
    return <Navigate to="/learner/dashboard" replace />;
  }

  return <Outlet />;
}
