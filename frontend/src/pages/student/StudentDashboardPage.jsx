import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardShell
      title={`Welcome, ${user?.name}`}
      subtitle="Student Dashboard — Phase 1 Authentication Verified"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-sm text-slate-700">
          You are signed in as a <strong className="font-semibold">Student</strong>.
          Complaint submission and tracking will be added in Phase 2.
        </p>
        <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block font-medium text-slate-700">Email</span>
            {user?.email}
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block font-medium text-slate-700">Department</span>
            {user?.department || "Not specified"}
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block font-medium text-slate-700">Student ID</span>
            {user?.studentId || "Not specified"}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
