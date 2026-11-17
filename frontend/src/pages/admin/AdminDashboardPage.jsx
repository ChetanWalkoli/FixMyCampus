import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  UserCheck,
  Users,
} from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import { Card, CardHeader } from "../../components/ui/Card";
import {
  Alert,
  EmptyState,
  LoadingRows,
  StatCard,
} from "../../components/ui/Feedback";
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

  return (
    <DashboardShell
      title="Campus Maintenance Operations"
      subtitle={`Signed in as ${user?.name} · Review incoming requests and coordinate staff.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Users className="h-4 w-4" />
            Manage Staff
          </Link>
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            <ClipboardList className="h-4 w-4" />
            All Complaints
          </Link>
        </div>
      }
    >
      <Alert className="mb-6">{error}</Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Complaints"
          value={summary.total}
          icon={ClipboardList}
          tone="neutral"
          loading={isLoading}
        />
        <StatCard
          label="Pending Review"
          value={summary.pending}
          icon={Clock}
          tone="amber"
          loading={isLoading}
        />
        <StatCard
          label="Assigned / Active"
          value={summary.assigned + summary.inProgress}
          icon={UserCheck}
          tone="brand"
          loading={isLoading}
        />
        <StatCard
          label="Resolved"
          value={summary.resolved}
          icon={CheckCircle2}
          tone="emerald"
          loading={isLoading}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Latest Campus Complaints"
          action={
            <Link
              to="/admin/complaints"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              View all
            </Link>
          }
        />

        {isLoading ? (
          <LoadingRows rows={5} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No complaints submitted yet"
            description="New student maintenance requests will appear here for triage."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/admin/complaints/${c._id}`}
                  className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-700">
                        {c.complaintId}
                      </span>
                      <span className="truncate text-sm font-medium text-slate-900">
                        {c.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
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
      </Card>
    </DashboardShell>
  );
}
