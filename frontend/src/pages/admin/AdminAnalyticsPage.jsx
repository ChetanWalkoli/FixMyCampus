import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Timer,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardShell from "../../components/layout/DashboardShell";
import { getAdminAnalytics } from "../../services/adminService";

const PIE_COLORS = [
  "#4f46e5",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#64748b",
  "#ef4444",
  "#f97316",
];

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getAdminAnalytics({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setAnalytics(res.data || null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load analytics data."
      );
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const kpiCards = analytics
    ? [
        {
          label: "Total Complaints",
          value: analytics.total,
          icon: BarChart3,
          tone: "text-indigo-700 bg-indigo-50",
        },
        {
          label: "Pending / Reopened",
          value: analytics.pending + (analytics.reopened || 0),
          icon: Clock,
          tone: "text-amber-700 bg-amber-50",
        },
        {
          label: "Resolved / Closed",
          value: analytics.resolved + (analytics.closed || 0),
          icon: CheckCircle2,
          tone: "text-emerald-700 bg-emerald-50",
        },
        {
          label: "Avg Resolution Time",
          value: `${analytics.averageResolutionHours} hrs`,
          icon: Timer,
          tone: "text-sky-700 bg-sky-50",
        },
      ]
    : [];

  return (
    <DashboardShell
      title="Analytics & Reporting"
      subtitle="Monitor campus maintenance volume, category trends, resolution speed, and staff workload."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="Start date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-xs text-slate-500">to</span>
          <input
            type="date"
            aria-label="End date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
          )}
        </div>
      }
    >
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading analytics...
        </div>
      ) : !analytics ? null : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((card) => {
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
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900">
                Complaints by Category
              </h2>
              {analytics.categoryBreakdown.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  No category data for the selected range.
                </p>
              ) : (
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900">
                Complaints by Status
              </h2>
              {analytics.statusBreakdown.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  No status data for the selected range.
                </p>
              ) : (
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.statusBreakdown}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {analytics.statusBreakdown.map((entry, idx) => (
                          <Cell
                            key={entry.status}
                            fill={PIE_COLORS[idx % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900">
                Monthly Complaint Trend
              </h2>
              {analytics.monthlyTrends.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  No monthly trend data available.
                </p>
              ) : (
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#4f46e5"
                        strokeWidth={2.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900">
                Staff Workload
              </h2>
              {analytics.staffWorkload.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  No staff assignments recorded yet.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Staff Member</th>
                        <th className="px-4 py-2.5">Department</th>
                        <th className="px-4 py-2.5 text-right">Active</th>
                        <th className="px-4 py-2.5 text-right">Completed</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.staffWorkload.map((row) => (
                        <tr key={row.staffId}>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.department}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-700 font-medium">
                            {row.active}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-700 font-medium">
                            {row.completed}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {row.totalAssigned}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
