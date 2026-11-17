import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      required: [true, "Role is required"],
    },
    department: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    employeeId: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.tokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 });

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
