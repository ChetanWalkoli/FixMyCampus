import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Clock, MapPin, User } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "../../components/common/StatusBadge";
import { getComplaintById } from "../../services/complaintService";

export default function ComplaintDetailsPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDetails = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await getComplaintById(id);
        if (!isMounted) return;
        setComplaint(res.data?.complaint || null);
        setHistory(res.data?.history || []);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Unable to load complaint details."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <DashboardShell
      title={
        complaint
          ? `${complaint.complaintId} — ${complaint.title}`
          : "Complaint Details"
      }
      subtitle="View full complaint information and status history."
      actions={
        <Link
          to="/student/complaints"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Complaints
        </Link>
      }
    >
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading complaint details...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : complaint ? (
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

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Description
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
                    <p className="font-medium text-slate-900">Assigned Staff</p>
                    <p className="text-slate-600">
                      {complaint.assignedTo?.name || "Awaiting assignment"}
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
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs h-fit">
            <h2 className="text-base font-semibold text-slate-900">
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
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <p className="text-sm font-medium capitalize text-slate-900">
                      {entry.action.replace("_", " ")}
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
            )}
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
