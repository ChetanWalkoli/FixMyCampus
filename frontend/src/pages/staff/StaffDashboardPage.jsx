import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardList, History, Wrench } from "lucide-react";
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
import { getStaffComplaints } from "../../services/staffService";

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      try {
        const res = await getStaffComplaints();
        if (!isMounted) return;
        setTasks(res.data?.complaints || []);
        setSummary(
          res.data?.summary || { assigned: 0, inProgress: 0, completed: 0 }
        );
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Failed to load assigned tasks."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadTasks();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardShell
      title="Assigned Work Queue"
      subtitle={`Signed in as ${user?.name}${user?.department ? ` · ${user.department}` : ""}`}
      actions={
        <Link
          to="/staff/history"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <History className="h-4 w-4" />
          Work History
        </Link>
      }
    >
      <Alert className="mb-6">{error}</Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Assigned to Me"
          value={summary.assigned}
          icon={ClipboardList}
          tone="sky"
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
          label="Completed"
          value={summary.completed}
          icon={CheckCircle2}
          tone="emerald"
          loading={isLoading}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Active Assigned Tasks"
          action={
            <Link
              to="/staff/tasks"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              View all tasks
            </Link>
          }
        />

        {isLoading ? (
          <LoadingRows rows={4} />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No active tasks assigned"
            description="New maintenance assignments from administrators will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.slice(0, 5).map((task) => (
              <li key={task._id}>
                <Link
                  to={`/staff/tasks/${task._id}`}
                  className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-700">
                        {task.complaintId}
                      </span>
                      <span className="truncate text-sm font-medium text-slate-900">
                        {task.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {task.location?.block}
                      {task.location?.room
                        ? ` · Room ${task.location.room}`
                        : ""}{" "}
                      · Reported by {task.submittedBy?.name || "Student"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
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
