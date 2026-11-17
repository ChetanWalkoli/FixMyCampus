import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  PlusCircle,
  Wrench,
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
import { getMyComplaints } from "../../services/complaintService";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const res = await getMyComplaints();
        if (!isMounted) return;
        setComplaints(res.data?.complaints || []);
        setSummary(
          res.data?.summary || {
            total: 0,
            pending: 0,
            inProgress: 0,
            resolved: 0,
          }
        );
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Failed to load your complaints."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const recentComplaints = complaints.slice(0, 5);

  return (
    <DashboardShell
      title="Student Maintenance Overview"
      subtitle={`Signed in as ${user?.name}${user?.studentId ? ` · ${user.studentId}` : ""}`}
      actions={
        <Link
          to="/student/complaints/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          <PlusCircle className="h-4 w-4" />
          New Complaint
        </Link>
      }
    >
      <Alert className="mb-6">{error}</Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Submitted"
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
          label="In Progress"
          value={summary.inProgress}
          icon={Wrench}
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
          title="Recent Complaints"
          action={
            <Link
              to="/student/complaints"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              View all
            </Link>
          }
        />

        {isLoading ? (
          <LoadingRows rows={4} />
        ) : recentComplaints.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No complaints submitted yet"
            description="Report an electrical, plumbing, or facility issue to track its resolution."
            action={
              <Link
                to="/student/complaints/new"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                <PlusCircle className="h-4 w-4" />
                Submit First Complaint
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentComplaints.map((complaint) => (
              <li key={complaint._id}>
                <Link
                  to={`/student/complaints/${complaint._id}`}
                  className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-700">
                        {complaint.complaintId}
                      </span>
                      <span className="truncate text-sm font-medium text-slate-900">
                        {complaint.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                      {complaint.location?.block}
                      {complaint.location?.room
                        ? ` · Room ${complaint.location.room}`
                        : ""}{" "}
                      · {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={complaint.priority} />
                    <StatusBadge status={complaint.status} />
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
