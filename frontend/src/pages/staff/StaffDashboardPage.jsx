import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";

export default function StaffDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardShell
      title={`Welcome, ${user?.name}`}
      subtitle="Maintenance Staff Dashboard — Phase 1 Authentication Verified"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-sm text-slate-700">
          You are signed in as{" "}
          <strong className="font-semibold">Maintenance Staff</strong>. Assigned
          tasks and resolution proof uploads will be added in Phase 4.
        </p>
      </div>
    </DashboardShell>
  );
}
