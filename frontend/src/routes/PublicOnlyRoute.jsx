import { Navigate, Outlet } from "react-router-dom";
import { getDashboardPathByRole, useAuth } from "../context/AuthContext";

export default function PublicOnlyRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPathByRole(user.role)} replace />;
  }

  return <Outlet />;
}
