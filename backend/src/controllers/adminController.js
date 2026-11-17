import mongoose from "mongoose";
import Complaint from "../models/Complaint.js";
import ComplaintHistory from "../models/ComplaintHistory.js";
import User from "../models/User.js";
import { formatZodError } from "../validators/authValidators.js";
import {
  assignStaffSchema,
  createStaffSchema,
  reviewComplaintSchema,
  updatePrioritySchema,
  updateStaffSchema,
} from "../validators/adminValidators.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findComplaintByParam = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { complaintId: id };
  return Complaint.findOne(query);
};

/**
 * @route   GET /api/v1/admin/complaints
 * @desc    List all campus complaints with filtering, sorting, and pagination
 * @access  Admin
 */
export const getAllComplaints = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      category,
      search,
      sort = "newest",
      page = "1",
      limit = "10",
    } = req.query;

    const filter = {};
    if (typeof status === "string" && status !== "all") filter.status = status;
    if (typeof priority === "string" && priority !== "all")
      filter.priority = priority;
    if (typeof category === "string" && category !== "all")
      filter.category = category;

    if (typeof search === "string" && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { title: regex },
        { complaintId: regex },
        { "location.block": regex },
        { "location.room": regex },
      ];
    }

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOption =
      sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [complaints, filteredTotal, allStatuses] = await Promise.all([
      Complaint.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate("submittedBy", "name email department studentId")
        .populate("assignedTo", "name email department"),
      Complaint.countDocuments(filter),
      Complaint.find({}).select("status"),
    ]);

    const summary = {
      total: allStatuses.length,
      pending: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
    };

    for (const item of allStatuses) {
      if (item.status === "pending" || item.status === "reopened")
        summary.pending += 1;
      else if (item.status === "assigned") summary.assigned += 1;
      else if (item.status === "in_progress") summary.inProgress += 1;
      else if (item.status === "resolved" || item.status === "closed")
        summary.resolved += 1;
      else if (item.status === "rejected") summary.rejected += 1;
    }

    return res.status(200).json({
      success: true,
      message: "Complaints retrieved successfully",
      data: {
        complaints,
        pagination: {
          total: filteredTotal,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(1, Math.ceil(filteredTotal / limitNum)),
        },
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/complaints/:id
 * @desc    Get full complaint details and history for admin review
 * @access  Admin
 */
export const getAdminComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { complaintId: id };

    const complaint = await Complaint.findOne(query)
      .populate("submittedBy", "name email department studentId")
      .populate("assignedTo", "name email department");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const history = await ComplaintHistory.find({ complaint: complaint._id })
      .sort({ createdAt: 1 })
      .populate("updatedBy", "name role");

    return res.status(200).json({
      success: true,
      message: "Complaint details retrieved successfully",
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
 * @route   PATCH /api/v1/admin/complaints/:id/review
 * @desc    Approve or reject a pending/reopened complaint
 * @access  Admin
 */
export const reviewComplaint = async (req, res, next) => {
  try {
    const parsed = reviewComplaintSchema.safeParse(req.body);
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

    if (!["pending", "reopened"].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot review a complaint in "${complaint.status}" status`,
      });
    }

    const { action, note } = parsed.data;
    const oldStatus = complaint.status;

    if (action === "reject") {
      complaint.status = "rejected";
      await complaint.save();

      await ComplaintHistory.create({
        complaint: complaint._id,
        updatedBy: req.user._id,
        action: "rejected",
        oldStatus,
        newStatus: "rejected",
        note,
      });
    } else {
      await ComplaintHistory.create({
        complaint: complaint._id,
        updatedBy: req.user._id,
        action: "reviewed",
        oldStatus,
        newStatus: oldStatus,
        note: note || "Complaint reviewed and approved for assignment",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        action === "reject"
          ? "Complaint rejected"
          : "Complaint approved for assignment",
      data: { complaint },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/admin/complaints/:id/assign
 * @desc    Assign an active maintenance staff member to a complaint
 * @access  Admin
 */
export const assignStaff = async (req, res, next) => {
  try {
    const parsed = assignStaffSchema.safeParse(req.body);
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

    if (!["pending", "reopened", "assigned"].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign staff when complaint is "${complaint.status}"`,
      });
    }

    const { staffId, note } = parsed.data;
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== "staff") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a valid maintenance staff member",
      });
    }

    if (!staff.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign an inactive staff member",
      });
    }

    const oldStatus = complaint.status;
    complaint.assignedTo = staff._id;
    complaint.status = "assigned";
    await complaint.save();

    await ComplaintHistory.create({
      complaint: complaint._id,
      updatedBy: req.user._id,
      action: "assigned",
      oldStatus,
      newStatus: "assigned",
      note: note || `Assigned to ${staff.name}`,
    });

    const populated = await Complaint.findById(complaint._id)
      .populate("submittedBy", "name email department studentId")
      .populate("assignedTo", "name email department");

    return res.status(200).json({
      success: true,
      message: `Complaint assigned to ${staff.name}`,
      data: { complaint: populated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/admin/complaints/:id/priority
 * @desc    Update complaint priority
 * @access  Admin
 */
export const updateComplaintPriority = async (req, res, next) => {
  try {
    const parsed = updatePrioritySchema.safeParse(req.body);
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

    const oldPriority = complaint.priority;
    complaint.priority = parsed.data.priority;
    await complaint.save();

    await ComplaintHistory.create({
      complaint: complaint._id,
      updatedBy: req.user._id,
      action: "note_added",
      oldStatus: complaint.status,
      newStatus: complaint.status,
      note: `Priority changed from ${oldPriority} to ${parsed.data.priority}`,
    });

    return res.status(200).json({
      success: true,
      message: "Complaint priority updated",
      data: { complaint },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/staff
 * @desc    List all maintenance staff accounts
 * @access  Admin
 */
export const getStaffList = async (_req, res, next) => {
  try {
    const staff = await User.find({ role: "staff" }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Staff list retrieved successfully",
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/admin/staff
 * @desc    Create a new maintenance staff account
 * @access  Admin
 */
export const createStaff = async (req, res, next) => {
  try {
    const parsed = createStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const { name, email, password, department } = parsed.data;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const staff = await User.create({
      name,
      email,
      password,
      role: "staff",
      department,
    });

    return res.status(201).json({
      success: true,
      message: "Staff account created successfully",
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/admin/staff/:id
 * @desc    Update staff member details or active status
 * @access  Admin
 */
export const updateStaff = async (req, res, next) => {
  try {
    const parsed = updateStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const staff = await User.findOne({ _id: req.params.id, role: "staff" });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    if (parsed.data.name !== undefined) staff.name = parsed.data.name;
    if (parsed.data.department !== undefined)
      staff.department = parsed.data.department;
    if (parsed.data.isActive !== undefined)
      staff.isActive = parsed.data.isActive;

    await staff.save();

    return res.status(200).json({
      success: true,
      message: "Staff account updated successfully",
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};
