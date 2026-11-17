import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Card } from "../../components/ui/Card";
import { Alert, EmptyState, LoadingRows } from "../../components/ui/Feedback";
import { getStaffWorkHistory } from "../../services/staffService";

export default function StaffHistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const res = await getStaffWorkHistory();
        if (!isMounted) return;
        setHistory(res.data?.complaints || []);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Failed to load completed work history."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardShell
      title="Completed Work History"
      subtitle="Review previously resolved maintenance tasks."
    >
      <Alert className="mb-5">{error}</Alert>

      <Card>
        {isLoading ? (
          <LoadingRows rows={4} />
        ) : history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No completed tasks yet"
            description="Tasks you mark as resolved will appear in your work history."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((item) => (
              <li key={item._id}>
                <Link
                  to={`/staff/tasks/${item._id}`}
                  className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-700">
                        {item.complaintId}
                      </span>
                      <span className="truncate text-sm font-medium text-slate-900">
                        {item.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                      {item.location?.block} · Resolved{" "}
                      {item.resolvedAt
                        ? new Date(item.resolvedAt).toLocaleDateString()
                        : new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}
