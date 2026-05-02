import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

export function ProtectedRoute({ roles }) {
  const token = useAuthStore((s) => s.token);
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!token) return <Navigate to="/auth/login" replace />;
  if (roles && !hasRole(roles)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
