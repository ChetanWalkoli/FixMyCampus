import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import { getStaffComplaints } from "../../services/staffService";

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await getStaffComplaints(
          statusFilter !== "all" ? { status: statusFilter } : {}
        );
        if (!isMounted) return;
        setTasks(res.data?.complaints || []);
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || "Failed to load tasks.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadTasks();
    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  return (
    <DashboardShell
      title="My Assigned Tasks"
      subtitle="Manage active maintenance work assigned to you."
      actions={
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Active</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
        </select>
      }
    >
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No tasks found for this filter.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => (
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
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {task.category} · {task.location?.block}
                      {task.location?.room
                        ? ` · Room ${task.location.room}`
                        : ""}
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
