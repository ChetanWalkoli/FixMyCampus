import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { StatusBadge } from "../../components/common/StatusBadge";
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
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Loading work history...
          </div>
        ) : history.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No completed tasks recorded yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((item) => (
              <li key={item._id}>
                <Link
                  to={`/staff/tasks/${item._id}`}
                  className="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {item.complaintId}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
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
      </div>
    </DashboardShell>
  );
}
