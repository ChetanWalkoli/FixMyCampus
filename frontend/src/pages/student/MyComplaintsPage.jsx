import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, PlusCircle, Search } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import { Card } from "../../components/ui/Card";
import { Alert, EmptyState, LoadingRows } from "../../components/ui/Feedback";
import { Select } from "../../components/ui/FormFields";
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
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          <PlusCircle className="h-4 w-4" />
          New Complaint
        </Link>
      }
    >
      <Card className="mb-5 p-3.5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search complaints"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, title, or block..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15"
            />
          </div>

          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {COMPLAINT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Alert className="mb-5">{error}</Alert>

      <Card>
        {isLoading ? (
          <LoadingRows rows={5} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No matching complaints found"
            description="Try clearing your filters or submit a new maintenance request."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {complaints.map((complaint) => (
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
                    <p className="mt-0.5 text-xs capitalize text-slate-500 tabular-nums">
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
      </Card>
    </DashboardShell>
  );
}
