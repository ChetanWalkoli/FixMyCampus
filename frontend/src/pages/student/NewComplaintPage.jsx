import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, ImagePlus, Send, X } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import {
  CAMPUS_BLOCKS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
} from "../../constants/complaintOptions";
import { createComplaint } from "../../services/complaintService";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function NewComplaintPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    category: "electrical",
    priority: "medium",
    block: CAMPUS_BLOCKS[0],
    floor: "",
    room: "",
    details: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are supported.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image file size cannot exceed 5 MB.");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("category", formData.category);
      payload.append("priority", formData.priority);
      payload.append(
        "location",
        JSON.stringify({
          block: formData.block,
          floor: formData.floor,
          room: formData.room,
          details: formData.details,
        })
      );

      if (imageFile) {
        payload.append("image", imageFile);
      }

      const res = await createComplaint(payload);
      const createdId = res.data?.complaint?._id;
      navigate(
        createdId ? `/student/complaints/${createdId}` : "/student/complaints",
        { replace: true }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit complaint. Please check your inputs."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell
      title="Submit New Complaint"
      subtitle="Report a campus infrastructure or maintenance issue."
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
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700"
            >
              Complaint Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              minLength={5}
              maxLength={120}
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Ceiling fan not working in Room 204"
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-slate-700"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-slate-700"
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {COMPLAINT_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Campus Location
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="block"
                  className="block text-xs font-medium text-slate-700"
                >
                  Building / Block
                </label>
                <select
                  id="block"
                  name="block"
                  value={formData.block}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                >
                  {CAMPUS_BLOCKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="floor"
                  className="block text-xs font-medium text-slate-700"
                >
                  Floor
                </label>
                <input
                  id="floor"
                  name="floor"
                  type="text"
                  value={formData.floor}
                  onChange={handleChange}
                  placeholder="e.g., 2nd Floor"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="room"
                  className="block text-xs font-medium text-slate-700"
                >
                  Room / Area
                </label>
                <input
                  id="room"
                  name="room"
                  type="text"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="e.g., Room 204"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="details"
                className="block text-xs font-medium text-slate-700"
              >
                Landmark / Additional Location Details (optional)
              </label>
              <input
                id="details"
                name="details"
                type="text"
                value={formData.details}
                onChange={handleChange}
                placeholder="e.g., Near north staircase"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              minLength={10}
              maxLength={2000}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue clearly so maintenance staff can diagnose it quickly..."
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Photo Evidence (optional, JPEG/PNG/WebP up to 5 MB)
            </label>

            {imagePreview ? (
              <div className="relative mt-2 inline-block">
                <img
                  src={imagePreview}
                  alt="Complaint preview"
                  className="h-40 w-auto rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white shadow hover:bg-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30">
                <ImagePlus className="h-6 w-6 text-slate-400" />
                <span className="mt-2 text-sm font-medium text-slate-700">
                  Click to attach a photo
                </span>
                <span className="mt-0.5 text-xs text-slate-500">
                  JPEG, PNG, or WebP (max 5 MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/student"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
