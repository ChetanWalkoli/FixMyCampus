import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardShell
      title={`Welcome, ${user?.name}`}
      subtitle="Admin Dashboard — Phase 1 Authentication Verified"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-sm text-slate-700">
          You are signed in as an{" "}
          <strong className="font-semibold">Administrator</strong>. Complaint
          management, staff assignment, and analytics will be added in Phase 3
          and Phase 6.
        </p>
      </div>
    </DashboardShell>
  );
}
