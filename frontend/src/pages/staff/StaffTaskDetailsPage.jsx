import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ImagePlus,
  MapPin,
  Play,
  Upload,
  User,
  X,
} from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import {
  getStaffComplaintById,
  updateStaffTaskStatus,
  uploadResolutionProof,
} from "../../services/staffService";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function StaffTaskDetailsPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [note, setNote] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadTask = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getStaffComplaintById(id);
      setComplaint(res.data?.complaint || null);
      setHistory(res.data?.history || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load task details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleStatusUpdate = async (nextStatus) => {
    setError("");
    setFeedback("");
    setIsUpdating(true);
    try {
      const res = await updateStaffTaskStatus(id, {
        status: nextStatus,
        note: note.trim() || undefined,
        resolutionNote:
          nextStatus === "resolved" ? note.trim() || undefined : undefined,
      });
      setFeedback(res.message || "Status updated.");
      setNote("");
      await loadTask();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProofSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are supported.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image size cannot exceed 5 MB.");
      return;
    }

    setError("");
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const clearProofSelection = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(null);
    setProofPreview("");
  };

  const handleProofUpload = async (e) => {
    e.preventDefault();
    if (!proofFile) return;

    setError("");
    setFeedback("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", proofFile);
      const res = await uploadResolutionProof(id, formData);
      setFeedback(res.message || "Resolution proof uploaded.");
      clearProofSelection();
      await loadTask();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to upload resolution proof."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardShell
      title={
        complaint
          ? `${complaint.complaintId} — ${complaint.title}`
          : "Task Details"
      }
      subtitle="Inspect issue details, update work status, and upload resolution proof."
      actions={
        <Link
          to="/staff/tasks"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Tasks
        </Link>
      }
    >
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading task details...
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
                          Reported By
                        </p>
                        <p className="text-slate-600">
                          {complaint.submittedBy?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {complaint.images?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                    <h2 className="text-base font-semibold text-slate-900">
                      Reported Issue Photos
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
                            alt="Reported issue"
                            className="h-48 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {complaint.resolutionProof?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                    <h2 className="text-base font-semibold text-slate-900">
                      Uploaded Resolution Proof
                    </h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {complaint.resolutionProof.map((img) => (
                        <a
                          key={img.publicId}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-lg border border-slate-200"
                        >
                          <img
                            src={img.url}
                            alt="Resolution proof"
                            className="h-48 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                  <h2 className="text-base font-semibold text-slate-900">
                    Work Timeline
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
                {["assigned", "in_progress"].includes(complaint.status) && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <h2 className="text-base font-semibold text-slate-900">
                      Update Work Status
                    </h2>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add maintenance notes or resolution summary..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    {complaint.status === "assigned" ? (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate("in_progress")}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Play className="h-4 w-4" />
                        {isUpdating ? "Updating..." : "Start Repair Work"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate("resolved")}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isUpdating ? "Updating..." : "Mark as Resolved"}
                      </button>
                    )}
                  </div>
                )}

                {["in_progress", "resolved"].includes(complaint.status) && (
                  <form
                    onSubmit={handleProofUpload}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
                  >
                    <h2 className="text-base font-semibold text-slate-900">
                      Upload Resolution Proof
                    </h2>

                    {proofPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={proofPreview}
                          alt="Proof preview"
                          className="h-36 w-full rounded-lg border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={clearProofSelection}
                          aria-label="Remove proof image"
                          className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white shadow"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-center transition hover:border-indigo-400">
                        <ImagePlus className="h-6 w-6 text-slate-400" />
                        <span className="mt-2 text-xs font-medium text-slate-700">
                          Select proof photo (max 5 MB)
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProofSelect}
                          className="hidden"
                        />
                      </label>
                    )}

                    <button
                      type="submit"
                      disabled={!proofFile || isUploading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload Proof"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
