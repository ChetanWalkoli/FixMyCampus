import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, PlusCircle, Search } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import {
  COMPLAINT_CATEGORIES,
  STATUS_META,
} from "../../constants/complaintOptions";
import { getMyComplaints } from "../../services/complaintService";

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadComplaints = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await getMyComplaints({
          search: search.trim() || undefined,
          status: statusFilter,
          category: categoryFilter,
        });
        if (!isMounted) return;
        setComplaints(res.data?.complaints || []);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Failed to load your complaints."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(loadComplaints, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, statusFilter, categoryFilter]);

  return (
    <DashboardShell
      title="My Complaints"
      subtitle="Search and track all maintenance requests you have submitted."
      actions={
        <Link
          to="/student/complaints/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <PlusCircle className="h-4 w-4" />
          New Complaint
        </Link>
      }
    >
      <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, title, or block..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {COMPLAINT_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              No matching complaints found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your filters or submit a new complaint.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {complaints.map((complaint) => (
              <li key={complaint._id}>
                <Link
                  to={`/student/complaints/${complaint._id}`}
                  className="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {complaint.complaintId}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {complaint.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {complaint.category} · {complaint.location?.block}
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
      </div>
    </DashboardShell>
  );
}
