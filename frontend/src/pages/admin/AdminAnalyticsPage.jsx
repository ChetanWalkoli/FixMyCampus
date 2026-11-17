import { useCallback, useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Clock, Timer } from "lucide-react";
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
import { Card } from "../../components/ui/Card";
import { Alert, LoadingRows, StatCard } from "../../components/ui/Feedback";
import { getAdminAnalytics } from "../../services/adminService";

const PIE_COLORS = [
  "#1d4ed8",
  "#d97706",
  "#059669",
  "#0284c7",
  "#64748b",
  "#dc2626",
  "#ea580c",
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

  return (
    <DashboardShell
      title="Analytics & Reporting"
      subtitle="Monitor maintenance volume, category trends, resolution speed, and staff workload."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="Start date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
          <span className="text-xs text-slate-500">to</span>
          <input
            type="date"
            aria-label="End date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
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
      <Alert className="mb-5">{error}</Alert>

      {isLoading ? (
        <Card>
          <LoadingRows rows={5} />
        </Card>
      ) : !analytics ? null : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Complaints"
              value={analytics.total}
              icon={BarChart3}
              tone="brand"
            />
            <StatCard
              label="Pending / Reopened"
              value={analytics.pending + (analytics.reopened || 0)}
              icon={Clock}
              tone="amber"
            />
            <StatCard
              label="Resolved / Closed"
              value={analytics.resolved + (analytics.closed || 0)}
              icon={CheckCircle2}
              tone="emerald"
            />
            <StatCard
              label="Avg Resolution Time"
              value={`${analytics.averageResolutionHours} hrs`}
              icon={Timer}
              tone="sky"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900">
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
                      <Bar
                        dataKey="count"
                        fill="#1d4ed8"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900">
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
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900">
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
                        stroke="#1d4ed8"
                        strokeWidth={2.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900">
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
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {analytics.staffWorkload.map((row) => (
                        <tr key={row.staffId}>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.department}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-amber-700">
                            {row.active}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-700">
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
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
