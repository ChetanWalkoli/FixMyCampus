import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Send, X } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Feedback";
import { Input, Select, Textarea } from "../../components/ui/FormFields";
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
      subtitle="Provide exact location and issue details for faster triage."
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
      <Card className="mx-auto max-w-2xl p-6 sm:p-8">
        <Alert className="mb-6">{error}</Alert>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="title"
            name="title"
            type="text"
            label="Complaint Title"
            required
            minLength={5}
            maxLength={120}
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Ceiling fan not working in Room 204"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="category"
              name="category"
              label="Category"
              value={formData.category}
              onChange={handleChange}
            >
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>

            <Select
              id="priority"
              name="priority"
              label="Priority"
              value={formData.priority}
              onChange={handleChange}
            >
              {COMPLAINT_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Campus Location
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                id="block"
                name="block"
                label="Building / Block"
                value={formData.block}
                onChange={handleChange}
              >
                {CAMPUS_BLOCKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>

              <Input
                id="floor"
                name="floor"
                type="text"
                label="Floor"
                value={formData.floor}
                onChange={handleChange}
                placeholder="e.g., 2nd Floor"
              />

              <Input
                id="room"
                name="room"
                type="text"
                label="Room / Area"
                value={formData.room}
                onChange={handleChange}
                placeholder="e.g., Room 204"
              />
            </div>

            <Input
              id="details"
              name="details"
              type="text"
              label="Landmark / Additional Details (optional)"
              value={formData.details}
              onChange={handleChange}
              placeholder="e.g., Near north staircase"
            />
          </div>

          <Textarea
            id="description"
            name="description"
            rows={4}
            label="Description"
            required
            minLength={10}
            maxLength={2000}
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the issue clearly so maintenance staff can diagnose it quickly..."
          />

          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-700">
              Photo Evidence (optional, JPEG/PNG/WebP up to 5 MB)
            </span>

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
              <label className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-6 py-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30">
                <ImagePlus className="h-5 w-5 text-slate-400" />
                <span className="mt-2 text-sm font-medium text-slate-700">
                  Attach a photo
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

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Link
              to="/student"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </Button>
          </div>
        </form>
      </Card>
    </DashboardShell>
  );
}
