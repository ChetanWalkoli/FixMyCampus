import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import { Card } from "../../components/ui/Card";
import { Alert, EmptyState, LoadingRows } from "../../components/ui/Feedback";
import { Select } from "../../components/ui/FormFields";
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
        <Select
          aria-label="Filter tasks by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Active</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
        </Select>
      }
    >
      <Alert className="mb-5">{error}</Alert>

      <Card>
        {isLoading ? (
          <LoadingRows rows={5} />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks found"
            description="No active tasks match the selected status filter."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => (
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
                    <p className="mt-0.5 text-xs capitalize text-slate-500">
                      {task.category} · {task.location?.block}
                      {task.location?.room
                        ? ` · Room ${task.location.room}`
                        : ""}
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
