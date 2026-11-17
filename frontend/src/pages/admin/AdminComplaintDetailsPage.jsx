import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  XCircle,
} from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import { COMPLAINT_PRIORITIES } from "../../constants/complaintOptions";
import {
  assignComplaintStaff,
  getAdminComplaintById,
  getStaffList,
  reviewComplaint,
  updateComplaintPriority,
} from "../../services/adminService";

export default function AdminComplaintDetailsPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [detailRes, staffRes] = await Promise.all([
        getAdminComplaintById(id),
        getStaffList(),
      ]);
      const loaded = detailRes.data?.complaint || null;
      setComplaint(loaded);
      setHistory(detailRes.data?.history || []);
      setSelectedPriority(loaded?.priority || "medium");
      setSelectedStaffId(loaded?.assignedTo?._id || "");
      setStaffList(
        (staffRes.data?.staff || []).filter((member) => member.isActive)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load complaint details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    setError("");
    setFeedback("");
    setIsSaving(true);
    try {
      const res = await assignComplaintStaff(id, { staffId: selectedStaffId });
      setFeedback(res.message || "Staff assigned successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign staff.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriorityUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setFeedback("");
    setIsSaving(true);
    try {
      const res = await updateComplaintPriority(id, {
        priority: selectedPriority,
      });
      setFeedback(res.message || "Priority updated.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update priority.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReview = async (action) => {
    setError("");
    setFeedback("");
    setIsSaving(true);
    try {
      const res = await reviewComplaint(id, {
        action,
        note: action === "reject" ? rejectNote : undefined,
      });
      setFeedback(res.message || "Complaint reviewed.");
      setShowRejectBox(false);
      setRejectNote("");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review complaint.");
    } finally {
      setIsSaving(false);
    }
  };

  const canReviewOrAssign =
    complaint && ["pending", "reopened", "assigned"].includes(complaint.status);

  return (
    <DashboardShell
      title={
        complaint
          ? `${complaint.complaintId} — ${complaint.title}`
          : "Manage Complaint"
      }
      subtitle="Review details, adjust priority, and assign maintenance staff."
      actions={
        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Complaints
        </Link>
      }
    >
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading complaint details...
        </div>
      ) : (
        <>
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

          {complaint && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
                      {complaint.category}
                    </span>
                  </div>

                  <h2 className="mt-4 text-base font-semibold text-slate-900">
                    Issue Description
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {complaint.description}
                  </p>

                  <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">Location</p>
                        <p className="text-slate-600">
                          {complaint.location?.block}
                          {complaint.location?.floor
                            ? `, ${complaint.location.floor}`
                            : ""}
                          {complaint.location?.room
                            ? `, ${complaint.location.room}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <User className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">
                          Submitted By
                        </p>
                        <p className="text-slate-600">
                          {complaint.submittedBy?.name} (
                          {complaint.submittedBy?.email})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {complaint.images?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                    <h2 className="text-base font-semibold text-slate-900">
                      Submitted Photos
                    </h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {complaint.images.map((img) => (
                        <a
                          key={img.publicId}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-lg border border-slate-200"
                        >
                          <img
                            src={img.url}
                            alt="Complaint attachment"
                            className="h-48 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                  <h2 className="text-base font-semibold text-slate-900">
                    Audit Timeline
                  </h2>
                  <ol className="mt-5 space-y-5 border-l border-slate-200 pl-4">
                    {history.map((entry) => (
                      <li key={entry._id} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                        <p className="text-sm font-medium capitalize text-slate-900">
                          {entry.action.replace("_", " ")}
                          {entry.updatedBy?.name
                            ? ` · ${entry.updatedBy.name}`
                            : ""}
                        </p>
                        {entry.note && (
                          <p className="mt-0.5 text-xs text-slate-600">
                            {entry.note}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="space-y-6">
                <form
                  onSubmit={handleAssignStaff}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
                >
                  <h2 className="text-base font-semibold text-slate-900">
                    Assign Maintenance Staff
                  </h2>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    disabled={!canReviewOrAssign || isSaving}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
                  >
                    <option value="">Select active staff member...</option>
                    {staffList.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                        {member.department ? ` (${member.department})` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={
                      !canReviewOrAssign || !selectedStaffId || isSaving
                    }
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Assign Staff"}
                  </button>
                </form>

                <form
                  onSubmit={handlePriorityUpdate}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
                >
                  <h2 className="text-base font-semibold text-slate-900">
                    Priority Level
                  </h2>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    {COMPLAINT_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Update Priority
                  </button>
                </form>

                {["pending", "reopened"].includes(complaint.status) && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                    <h2 className="text-base font-semibold text-slate-900">
                      Review Decision
                    </h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleReview("approve")}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => setShowRejectBox((v) => !v)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>

                    {showRejectBox && (
                      <div className="space-y-2 pt-2">
                        <textarea
                          rows={3}
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="Provide a reason for rejecting this complaint..."
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isSaving || rejectNote.trim().length < 5}
                          onClick={() => handleReview("reject")}
                          className="w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
