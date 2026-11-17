import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
} from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import { Card } from "../../components/ui/Card";
import { Alert, EmptyState, LoadingRows } from "../../components/ui/Feedback";
import { Select } from "../../components/ui/FormFields";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  STATUS_META,
} from "../../constants/complaintOptions";
import { getAdminComplaints } from "../../services/adminService";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadComplaints = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await getAdminComplaints({
          search: search.trim() || undefined,
          status: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          sort: sortOrder,
          page,
          limit: 10,
        });
        if (!isMounted) return;
        setComplaints(res.data?.complaints || []);
        setPagination(
          res.data?.pagination || { total: 0, page: 1, totalPages: 1 }
        );
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Failed to load campus complaints."
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
  }, [search, statusFilter, priorityFilter, categoryFilter, sortOrder, page]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <DashboardShell
      title="All Campus Complaints"
      subtitle="Filter, inspect, prioritize, and assign maintenance requests."
    >
      <Card className="mb-5 p-3.5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search complaints"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search ID, title, or location..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15"
            />
          </div>

          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={handleFilterChange(setStatusFilter)}
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={handleFilterChange(setPriorityFilter)}
          >
            <option value="all">All Priorities</option>
            {COMPLAINT_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={handleFilterChange(setCategoryFilter)}
            >
              <option value="all">Category</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Sort order"
              value={sortOrder}
              onChange={handleFilterChange(setSortOrder)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </Select>
          </div>
        </div>
      </Card>

      <Alert className="mb-5">{error}</Alert>

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingRows rows={6} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No matching complaints"
            description="No complaints match the current search or filter criteria."
          />
        ) : (
          <>
            {/* Mobile Card List */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {complaints.map((c) => (
                <li key={c._id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-blue-700">
                        {c.complaintId}
                      </span>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {c.title}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {c.submittedBy?.name || "Student"} · {c.location?.block}
                    {c.location?.room ? `, ${c.location.room}` : ""}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <PriorityBadge priority={c.priority} />
                    <Link
                      to={`/admin/complaints/${c._id}`}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                    >
                      Manage →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">ID &amp; Issue</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assigned To</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-blue-700">
                          {c.complaintId}
                        </span>
                        <p className="mt-0.5 font-medium text-slate-900">
                          {c.title}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {c.submittedBy?.name || "Student"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {c.location?.block}
                        {c.location?.room ? `, ${c.location.room}` : ""}
                      </td>
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {c.assignedTo?.name || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/admin/complaints/${c._id}`}
                          className="font-semibold text-blue-700 hover:text-blue-800"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-600 tabular-nums">
            <span>
              Page {pagination.page} of {pagination.totalPages} (
              {pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
