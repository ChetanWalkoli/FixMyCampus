import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  History,
  Wrench,
} from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
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

  const statCards = [
    {
      label: "Assigned to Me",
      value: summary.assigned,
      icon: ClipboardList,
      tone: "text-blue-700 bg-blue-50",
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      icon: Wrench,
      tone: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: CheckCircle2,
      tone: "text-emerald-700 bg-emerald-50",
    },
  ];

  return (
    <DashboardShell
      title={`Welcome, ${user?.name}`}
      subtitle="View your assigned maintenance tasks and update repair progress."
      actions={
        <Link
          to="/staff/history"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <History className="h-4 w-4" />
          Work History
        </Link>
      }
    >
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
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
            Active Assigned Tasks
          </h2>
          <Link
            to="/staff/tasks"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all tasks
          </Link>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Loading assigned tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No active maintenance tasks assigned to you right now.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.slice(0, 5).map((task) => (
              <li key={task._id}>
                <Link
                  to={`/staff/tasks/${task._id}`}
                  className="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {task.complaintId}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {task.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {task.location?.block}
                      {task.location?.room
                        ? ` · Room ${task.location.room}`
                        : ""}{" "}
                      · Reported by {task.submittedBy?.name || "Student"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
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
