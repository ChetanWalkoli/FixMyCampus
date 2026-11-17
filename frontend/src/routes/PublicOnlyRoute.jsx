import { Navigate, Outlet } from "react-router-dom";
import { getDashboardPathByRole, useAuth } from "../context/AuthContext";

export default function PublicOnlyRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm font-medium text-slate-600">
          Loading...
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPathByRole(user.role)} replace />;
  }

  return <Outlet />;
}
