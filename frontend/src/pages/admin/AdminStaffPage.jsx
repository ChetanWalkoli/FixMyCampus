import { useCallback, useEffect, useState } from "react";
import {
  MailPlus,
  RefreshCw,
  Search,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Alert, EmptyState, LoadingRows } from "../../components/ui/Feedback";
import { Input, Select } from "../../components/ui/FormFields";
import {
  getAllUsers,
  getInvitations,
  inviteUser,
  resendInvitation,
  revokeInvitation,
  updateUser,
  updateUserStatus,
} from "../../services/adminService";

export default function AdminStaffPage() {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    role: "staff",
    department: "",
    employeeId: "",
  });

  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    department: "",
    employeeId: "",
    role: "staff",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [usersRes, invitesRes] = await Promise.all([
        getAllUsers({
          search: search.trim() || undefined,
          role: roleFilter,
          department: departmentFilter.trim() || undefined,
          status: statusFilter,
        }),
        getInvitations(),
      ]);
      setUsers(usersRes.data?.users || []);
      setInvitations(invitesRes.data?.invitations || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load users and invitations."
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, departmentFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadData, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setFeedback("");
    setIsSubmitting(true);
    try {
      const res = await inviteUser(inviteData);
      setFeedback(res.message || "Invitation sent.");
      setInviteData({
        name: "",
        email: "",
        role: "staff",
        department: "",
        employeeId: "",
      });
      setShowInviteForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (invId) => {
    setError("");
    setFeedback("");
    try {
      const res = await resendInvitation(invId);
      setFeedback(res.message || "Invitation resent.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend invitation.");
    }
  };

  const handleRevoke = async (invId) => {
    setError("");
    setFeedback("");
    try {
      const res = await revokeInvitation(invId);
      setFeedback(res.message || "Invitation revoked.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to revoke invitation.");
    }
  };

  const handleToggleStatus = async (user) => {
    setError("");
    setFeedback("");
    try {
      const res = await updateUserStatus(user._id, !user.isActive);
      setFeedback(res.message || "Account status updated.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update account status."
      );
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditData({
      name: user.name || "",
      department: user.department || "",
      employeeId: user.employeeId || "",
      role: user.role,
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setError("");
    setFeedback("");
    setIsSubmitting(true);
    try {
      const res = await updateUser(editingUser._id, editData);
      setFeedback(res.message || "User updated.");
      setEditingUser(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  return (
    <DashboardShell
      title="Users & Invitations"
      subtitle="Invite Staff or Admins via email, manage pending invitations, and control account access."
      actions={
        <Button type="button" onClick={() => setShowInviteForm((v) => !v)}>
          <MailPlus className="h-4 w-4" />
          {showInviteForm ? "Close Invite Form" : "Invite Staff / Admin"}
        </Button>
      }
    >
      <Alert className="mb-5">{error}</Alert>
      <Alert variant="success" className="mb-5">
        {feedback}
      </Alert>

      {showInviteForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={handleInvite}>
            <h2 className="text-sm font-semibold text-slate-900">
              Send Account Invitation
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              The invited user will receive a secure single-use activation link
              to set their own password.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                id="inviteName"
                type="text"
                label="Full name"
                required
                placeholder="Ramesh Kumar"
                value={inviteData.name}
                onChange={(e) =>
                  setInviteData((p) => ({ ...p, name: e.target.value }))
                }
              />
              <Input
                id="inviteEmail"
                type="email"
                label="Email address"
                required
                placeholder="ramesh@college.edu"
                value={inviteData.email}
                onChange={(e) =>
                  setInviteData((p) => ({ ...p, email: e.target.value }))
                }
              />
              <Select
                id="inviteRole"
                label="Role"
                value={inviteData.role}
                onChange={(e) =>
                  setInviteData((p) => ({ ...p, role: e.target.value }))
                }
              >
                <option value="staff">Maintenance Staff</option>
                <option value="admin">Administrator</option>
              </Select>
              <Input
                id="inviteDepartment"
                type="text"
                label="Department / Trade"
                placeholder="e.g., Electrical"
                value={inviteData.department}
                onChange={(e) =>
                  setInviteData((p) => ({ ...p, department: e.target.value }))
                }
              />
              <Input
                id="inviteEmployeeId"
                type="text"
                label="Employee ID (optional)"
                placeholder="e.g., EMP-104"
                value={inviteData.employeeId}
                onChange={(e) =>
                  setInviteData((p) => ({ ...p, employeeId: e.target.value }))
                }
              />
            </div>
            <div className="mt-5 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {editingUser && (
        <Card className="mb-6 border-blue-200 p-6">
          <form onSubmit={handleEditSave}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Edit User — {editingUser.email}
              </h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                id="editName"
                type="text"
                label="Full name"
                required
                value={editData.name}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, name: e.target.value }))
                }
              />
              <Input
                id="editDepartment"
                type="text"
                label="Department"
                value={editData.department}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, department: e.target.value }))
                }
              />
              <Input
                id="editEmployeeId"
                type="text"
                label="Employee ID"
                value={editData.employeeId}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, employeeId: e.target.value }))
                }
              />
              <Select
                id="editRole"
                label="Role"
                value={editData.role}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, role: e.target.value }))
                }
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Pending Invitations */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader
          title={`Pending Invitations (${pendingInvitations.length})`}
        />
        {pendingInvitations.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-500">
            No pending invitations.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pendingInvitations.map((inv) => {
              const isExpired = new Date(inv.expiresAt) <= new Date();
              return (
                <li
                  key={inv._id}
                  className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {inv.name}
                      </span>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
                        {inv.role}
                      </span>
                      {isExpired && (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                      {inv.email}
                      {inv.department ? ` · ${inv.department}` : ""} · Expires{" "}
                      {new Date(inv.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResend(inv._id)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Resend
                    </Button>
                    <Button
                      type="button"
                      variant="dangerSoft"
                      size="sm"
                      onClick={() => handleRevoke(inv._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Filters */}
      <Card className="mb-5 p-3.5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15"
            />
          </div>

          <Select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </Select>

          <input
            type="text"
            aria-label="Filter by department"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            placeholder="Filter by department..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15"
          />

          <Select
            aria-label="Filter by account status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </Card>

      {/* User Directory */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingRows rows={5} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No matching users found"
            description="Adjust your search or role filters, or invite new staff and administrators."
          />
        ) : (
          <>
            {/* Mobile Cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {users.map((member) => (
                <li key={member._id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs capitalize text-slate-500 tabular-nums">
                    {member.role} · {member.department || "General"} · Joined{" "}
                    {new Date(member.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <button
                      type="button"
                      onClick={() => openEdit(member)}
                      className="font-semibold text-slate-700 hover:text-slate-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(member)}
                      className="font-semibold text-blue-700 hover:text-blue-800"
                    >
                      {member.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {users.map((member) => (
                    <tr key={member._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </td>
                      <td className="px-5 py-3.5 capitalize text-slate-700">
                        {member.role}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {member.department || "General"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
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
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEdit(member)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            <UserCog className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(member)}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                          >
                            {member.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </DashboardShell>
  );
}
