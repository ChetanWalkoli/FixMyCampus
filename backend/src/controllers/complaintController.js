import mongoose from "mongoose";
import Complaint from "../models/Complaint.js";
import ComplaintHistory from "../models/ComplaintHistory.js";
import { createComplaintSchema } from "../validators/complaintValidators.js";
import { formatZodError } from "../validators/authValidators.js";
import { generateComplaintId } from "../utils/generateComplaintId.js";
import { uploadImageBuffer } from "../services/uploadService.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @route   POST /api/v1/complaints
 * @desc    Submit a new maintenance complaint (Student only)
 * @access  Student
 */
export const createComplaint = async (req, res, next) => {
  try {
    let parsedLocation = req.body.location;
    if (typeof parsedLocation === "string") {
      try {
        parsedLocation = JSON.parse(parsedLocation);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid location format",
        });
      }
    }

    const parsed = createComplaintSchema.safeParse({
      ...req.body,
      location: parsedLocation,
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const images = [];
    if (req.file) {
      const uploaded = await uploadImageBuffer(
        req.file.buffer,
        "fixmycampus/complaints"
      );
      images.push(uploaded);
    }

    const complaintId = await generateComplaintId();

    const complaint = await Complaint.create({
      complaintId,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
      location: parsed.data.location,
      images,
      status: "pending",
      submittedBy: req.user._id,
    });

    await ComplaintHistory.create({
      complaint: complaint._id,
      updatedBy: req.user._id,
      action: "submitted",
      oldStatus: null,
      newStatus: "pending",
      note: "Complaint submitted by student",
    });

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: {
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/complaints/my
 * @desc    List complaints submitted by the authenticated student
 * @access  Student
 */
export const getMyComplaints = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;

    const baseFilter = { submittedBy: req.user._id };
    const queryFilter = { ...baseFilter };

    if (typeof status === "string" && status !== "all") {
      queryFilter.status = status;
    }

    if (typeof category === "string" && category !== "all") {
      queryFilter.category = category;
    }

    if (typeof search === "string" && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      queryFilter.$or = [
        { title: regex },
        { complaintId: regex },
        { "location.block": regex },
        { "location.room": regex },
      ];
    }

    const [complaints, allStudentComplaints] = await Promise.all([
      Complaint.find(queryFilter)
        .sort({ createdAt: -1 })
        .populate("assignedTo", "name department"),
      Complaint.find(baseFilter).select("status"),
    ]);

    const summary = {
      total: allStudentComplaints.length,
      pending: 0,
      inProgress: 0,
      resolved: 0,
    };

    for (const item of allStudentComplaints) {
      if (item.status === "pending") summary.pending += 1;
      else if (item.status === "assigned" || item.status === "in_progress")
        summary.inProgress += 1;
      else if (item.status === "resolved" || item.status === "closed")
        summary.resolved += 1;
    }

    return res.status(200).json({
      success: true,
      message: "Complaints retrieved successfully",
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
 * @route   GET /api/v1/complaints/:id
 * @desc    Get details and history for a single complaint owned by the student
 * @access  Student
 */
export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { complaintId: id };

    const complaint = await Complaint.findOne(query)
      .populate("submittedBy", "name email department studentId")
      .populate("assignedTo", "name department");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const ownerId =
      complaint.submittedBy?._id?.toString() ||
      complaint.submittedBy?.toString();

    if (ownerId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this complaint",
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
