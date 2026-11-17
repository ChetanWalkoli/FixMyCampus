import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  RotateCcw,
  Star,
  User,
} from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Alert, LoadingRows } from "../../components/ui/Feedback";
import { Textarea } from "../../components/ui/FormFields";
import {
  getComplaintById,
  submitComplaintFeedback,
} from "../../services/complaintService";

export default function ComplaintDetailsPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getComplaintById(id);
      setComplaint(res.data?.complaint || null);
      setHistory(res.data?.history || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load complaint details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleFeedback = async (action) => {
    setError("");
    setFeedbackSuccess("");
    setIsSubmittingFeedback(true);
    try {
      const res = await submitComplaintFeedback(id, {
        action,
        rating: action === "close" ? rating : undefined,
        comment: comment.trim() || undefined,
      });
      setFeedbackSuccess(res.message || "Feedback submitted.");
      setComment("");
      await loadDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit feedback.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <DashboardShell
      title={
        complaint
          ? `${complaint.complaintId} — ${complaint.title}`
          : "Complaint Details"
      }
      subtitle="Full complaint information, resolution proof, and status history."
      actions={
        <Link
          to="/student/complaints"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Complaints
        </Link>
      }
    >
      {isLoading ? (
        <Card>
          <LoadingRows rows={4} />
        </Card>
      ) : (
        <>
          <Alert className="mb-5">{error}</Alert>
          <Alert variant="success" className="mb-5">
            {feedbackSuccess}
          </Alert>

          {complaint && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card className="p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
                      {complaint.category}
                    </span>
                  </div>

                  <h2 className="mt-4 text-sm font-semibold text-slate-900">
                    Description
                  </h2>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {complaint.description}
                  </p>

                  {complaint.resolutionNote && (
                    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                        Maintenance Resolution Note
                      </p>
                      <p className="mt-1 text-sm text-emerald-900">
                        {complaint.resolutionNote}
                      </p>
                    </div>
                  )}

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
                        {complaint.location?.details && (
                          <p className="text-xs text-slate-500">
                            {complaint.location.details}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <User className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">
                          Assigned Staff
                        </p>
                        <p className="text-slate-600">
                          {complaint.assignedTo?.name || "Awaiting assignment"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {complaint.images?.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Submitted Photos
                    </h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
                  </Card>
                )}

                {complaint.resolutionProof?.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Resolution Proof Photos
                    </h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
                  </Card>
                )}

                {complaint.status === "resolved" &&
                  !complaint.feedback?.submittedAt && (
                    <Card className="space-y-4 p-6">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          Verify Resolution &amp; Submit Feedback
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Rate the repair work to close this complaint, or
                          reopen it if the issue persists.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            aria-label={`Rate ${star} stars`}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm font-medium text-slate-700 tabular-nums">
                          {rating} / 5
                        </span>
                      </div>

                      <Textarea
                        id="feedbackComment"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share feedback on the repair (required if reopening)..."
                      />

                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="success"
                          disabled={isSubmittingFeedback}
                          onClick={() => handleFeedback("close")}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Confirm &amp; Close
                        </Button>
                        <Button
                          type="button"
                          variant="dangerSoft"
                          disabled={
                            isSubmittingFeedback || comment.trim().length < 5
                          }
                          onClick={() => handleFeedback("reopen")}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reopen Issue
                        </Button>
                      </div>
                    </Card>
                  )}

                {complaint.feedback?.submittedAt && (
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Your Feedback
                    </h2>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= complaint.feedback.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xs text-slate-500 tabular-nums">
                        Submitted{" "}
                        {new Date(
                          complaint.feedback.submittedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {complaint.feedback.comment && (
                      <p className="mt-2 text-sm text-slate-600">
                        {complaint.feedback.comment}
                      </p>
                    )}
                  </Card>
                )}
              </div>

              <Card className="h-fit p-6">
                <h2 className="text-sm font-semibold text-slate-900">
                  Status Timeline
                </h2>
                {history.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    No history entries yet.
                  </p>
                ) : (
                  <ol className="mt-5 space-y-5 border-l border-slate-200 pl-4">
                    {history.map((entry) => (
                      <li key={entry._id} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-700 ring-4 ring-white" />
                        <p className="text-sm font-medium capitalize text-slate-900">
                          {entry.action.replace("_", " ")}
                        </p>
                        {entry.note && (
                          <p className="mt-0.5 text-xs text-slate-600">
                            {entry.note}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400 tabular-nums">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
