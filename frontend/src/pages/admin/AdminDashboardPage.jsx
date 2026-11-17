import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  UserCheck,
  Users,
} from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { getAdminComplaints } from "../../services/adminService";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAdminOverview = async () => {
      try {
        const res = await getAdminComplaints({ limit: 5 });
        if (!isMounted) return;
        setComplaints(res.data?.complaints || []);
        setSummary(
          res.data?.summary || {
            total: 0,
            pending: 0,
            assigned: 0,
            inProgress: 0,
            resolved: 0,
          }
        );
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Failed to load admin overview."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAdminOverview();
    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = [
    {
      label: "Total Complaints",
      value: summary.total,
      icon: ClipboardList,
      tone: "text-slate-700 bg-slate-100",
    },
    {
      label: "Pending Review",
      value: summary.pending,
      icon: Clock,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Assigned / Active",
      value: summary.assigned + summary.inProgress,
      icon: UserCheck,
      tone: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "Resolved",
      value: summary.resolved,
      icon: CheckCircle2,
      tone: "text-emerald-700 bg-emerald-50",
    },
  ];

  return (
    <DashboardShell
      title={`Admin Overview — ${user?.name}`}
      subtitle="Review campus maintenance complaints and coordinate staff assignments."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Users className="h-4 w-4" />
            Manage Staff
          </Link>
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <ClipboardList className="h-4 w-4" />
            All Complaints
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {card.label}
                </span>
                <div className={`rounded-lg p-2 ${card.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {isLoading ? "—" : card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Latest Campus Complaints
          </h2>
          <Link
            to="/admin/complaints"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No complaints have been submitted yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/admin/complaints/${c._id}`}
                  className="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {c.complaintId}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {c.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Submitted by {c.submittedBy?.name || "Student"} ·{" "}
                      {c.location?.block} ·{" "}
                      {c.assignedTo?.name
                        ? `Assigned to ${c.assignedTo.name}`
                        : "Unassigned"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
