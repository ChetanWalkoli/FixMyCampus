import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      enum: [
        "electrical",
        "plumbing",
        "furniture",
        "cleaning",
        "network",
        "equipment",
        "other",
      ],
      required: [true, "Category is required"],
    },
    location: {
      block: { type: String, trim: true },
      floor: { type: String, trim: true },
      room: { type: String, trim: true },
      details: { type: String, trim: true },
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "in_progress",
        "resolved",
        "closed",
        "rejected",
        "reopened",
      ],
      default: "pending",
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    resolutionProof: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNote: {
      type: String,
      trim: true,
    },
    resolvedAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

complaintSchema.index({ submittedBy: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ category: 1, createdAt: -1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
