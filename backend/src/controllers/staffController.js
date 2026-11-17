import mongoose from "mongoose";
import Complaint from "../models/Complaint.js";
import ComplaintHistory from "../models/ComplaintHistory.js";
import { formatZodError } from "../validators/authValidators.js";
import { updateTaskStatusSchema } from "../validators/staffValidators.js";
import { uploadImageBuffer } from "../services/uploadService.js";
import { createNotification } from "../services/notificationService.js";

const VALID_STAFF_TRANSITIONS = {
  assigned: ["in_progress"],
  in_progress: ["resolved"],
};

const findComplaintByParam = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { complaintId: id };
  return Complaint.findOne(query);
};

const isAssignedToStaff = (complaint, userId) => {
  const assignedId =
    complaint.assignedTo?._id?.toString() || complaint.assignedTo?.toString();
  return Boolean(assignedId && assignedId === userId.toString());
};

/**
 * @route   GET /api/v1/staff/complaints
 * @desc    List tasks assigned to the authenticated maintenance staff member
 * @access  Staff
 */
export const getAssignedComplaints = async (req, res, next) => {
  try {
    const { status } = req.query;
    const baseFilter = { assignedTo: req.user._id };

    const activeFilter = { ...baseFilter };
    if (
      typeof status === "string" &&
      ["assigned", "in_progress"].includes(status)
    ) {
      activeFilter.status = status;
    } else {
      activeFilter.status = { $in: ["assigned", "in_progress"] };
    }

    const [complaints, allAssigned] = await Promise.all([
      Complaint.find(activeFilter)
        .sort({ createdAt: -1 })
        .populate("submittedBy", "name email department"),
      Complaint.find(baseFilter).select("status"),
    ]);

    const summary = {
      assigned: 0,
      inProgress: 0,
      completed: 0,
    };

    for (const item of allAssigned) {
      if (item.status === "assigned") summary.assigned += 1;
      else if (item.status === "in_progress") summary.inProgress += 1;
      else if (item.status === "resolved" || item.status === "closed")
        summary.completed += 1;
    }

    return res.status(200).json({
      success: true,
      message: "Assigned tasks retrieved successfully",
      data: {
        complaints,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/staff/complaints/:id
 * @desc    Get task details and history (assigned staff only)
 * @access  Staff
 */
export const getStaffComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { complaintId: id };

    const complaint = await Complaint.findOne(query)
      .populate("submittedBy", "name email department")
      .populate("assignedTo", "name email department");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (!isAssignedToStaff(complaint, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this complaint",
      });
    }

    const history = await ComplaintHistory.find({ complaint: complaint._id })
      .sort({ createdAt: 1 })
      .populate("updatedBy", "name role");

    return res.status(200).json({
      success: true,
      message: "Task details retrieved successfully",
      data: {
        complaint,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/staff/complaints/:id/status
 * @desc    Update status of an assigned task (assigned -> in_progress -> resolved)
 * @access  Staff
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const parsed = updateTaskStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const complaint = await findComplaintByParam(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (!isAssignedToStaff(complaint, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update complaints assigned to you",
      });
    }

    const { status: nextStatus, note, resolutionNote } = parsed.data;
    const allowedNext = VALID_STAFF_TRANSITIONS[complaint.status] || [];

    if (!allowedNext.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${complaint.status}" to "${nextStatus}"`,
      });
    }

    const oldStatus = complaint.status;
    complaint.status = nextStatus;

    if (nextStatus === "resolved") {
      complaint.resolvedAt = new Date();
      if (resolutionNote) {
        complaint.resolutionNote = resolutionNote;
      }
    }

    await complaint.save();

    await ComplaintHistory.create({
      complaint: complaint._id,
      updatedBy: req.user._id,
      action: nextStatus === "resolved" ? "resolved" : "status_changed",
      oldStatus,
      newStatus: nextStatus,
      note:
        note ||
        resolutionNote ||
        (nextStatus === "in_progress"
          ? "Maintenance work started"
          : "Marked as resolved"),
    });

    await createNotification({
      recipient: complaint.submittedBy,
      complaint: complaint._id,
      title:
        nextStatus === "resolved"
          ? `Complaint ${complaint.complaintId} Resolved`
          : `Work Started on ${complaint.complaintId}`,
      message:
        nextStatus === "resolved"
          ? `Your complaint "${complaint.title}" has been marked as resolved. Please review and submit feedback.`
          : `Maintenance staff has started work on "${complaint.title}".`,
      type:
        nextStatus === "resolved" ? "complaint_resolved" : "status_updated",
    });

    return res.status(200).json({
      success: true,
      message: `Task status updated to ${nextStatus.replace("_", " ")}`,
      data: { complaint },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/staff/complaints/:id/proof
 * @desc    Upload resolution proof photograph for an assigned task
 * @access  Staff
 */
export const uploadResolutionProof = async (req, res, next) => {
  try {
    const complaint = await findComplaintByParam(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (!isAssignedToStaff(complaint, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only upload proof for complaints assigned to you",
      });
    }

    if (!["in_progress", "resolved"].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Resolution proof can only be uploaded once work is in progress or resolved",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please attach a resolution proof image",
      });
    }

    const uploaded = await uploadImageBuffer(
      req.file.buffer,
      "fixmycampus/resolutions"
    );

    complaint.resolutionProof.push(uploaded);
    await complaint.save();

    await ComplaintHistory.create({
      complaint: complaint._id,
      updatedBy: req.user._id,
      action: "note_added",
      oldStatus: complaint.status,
      newStatus: complaint.status,
      note: "Uploaded resolution proof photograph",
    });

    return res.status(200).json({
      success: true,
      message: "Resolution proof uploaded successfully",
      data: { complaint },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/staff/history
 * @desc    List completed tasks for the authenticated staff member
 * @access  Staff
 */
export const getStaffHistory = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({
      assignedTo: req.user._id,
      status: { $in: ["resolved", "closed"] },
    })
      .sort({ resolvedAt: -1, updatedAt: -1 })
      .populate("submittedBy", "name email department");

    return res.status(200).json({
      success: true,
      message: "Completed work history retrieved successfully",
      data: { complaints },
    });
  } catch (error) {
    next(error);
  }
};
