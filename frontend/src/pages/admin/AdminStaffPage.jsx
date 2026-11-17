import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import {
  createStaffMember,
  getStaffList,
  updateStaffMember,
} from "../../services/adminService";

export default function AdminStaffPage() {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getStaffList();
      setStaff(res.data?.staff || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load staff list.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setFeedback("");
    setIsSubmitting(true);
    try {
      const res = await createStaffMember(formData);
      setFeedback(res.message || "Staff account created.");
      setFormData({ name: "", email: "", password: "", department: "" });
      setShowForm(false);
      await loadStaff();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create staff account."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (member) => {
    setError("");
    setFeedback("");
    try {
      const res = await updateStaffMember(member._id, {
        isActive: !member.isActive,
      });
      setFeedback(res.message || "Staff status updated.");
      await loadStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update staff status.");
    }
  };

  return (
    <DashboardShell
      title="Staff Management"
      subtitle="Create and manage maintenance staff accounts."
      actions={
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          {showForm ? "Close Form" : "Add Staff Member"}
        </button>
      }
    >
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          <h2 className="text-base font-semibold text-slate-900">
            New Maintenance Staff Account
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Full name"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="email"
              required
              placeholder="Email address"
              value={formData.email}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Department / Trade (e.g., Electrical)"
              value={formData.department}
              onChange={(e) =>
                setFormData((p) => ({ ...p, department: e.target.value }))
              }
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Initial password (min 8 chars)"
              value={formData.password}
              onChange={(e) =>
                setFormData((p) => ({ ...p, password: e.target.value }))
              }
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Staff Account"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Loading staff directory...
          </div>
        ) : staff.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No maintenance staff accounts created yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => (
                <tr key={member._id}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {member.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{member.email}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {member.department || "General"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(member)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {member.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
