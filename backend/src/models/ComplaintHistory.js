import mongoose from "mongoose";

const complaintHistorySchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "submitted",
        "reviewed",
        "assigned",
        "status_changed",
        "rejected",
        "reopened",
        "resolved",
        "closed",
        "note_added",
      ],
      required: true,
    },
    oldStatus: String,
    newStatus: String,
    note: String,
  },
  { timestamps: true }
);

complaintHistorySchema.index({ complaint: 1, createdAt: 1 });

const ComplaintHistory = mongoose.model(
  "ComplaintHistory",
  complaintHistorySchema
);

export default ComplaintHistory;
