import User from "../models/User.js";
import {
  registerSchema,
  loginSchema,
  provisionUserSchema,
  formatZodError,
} from "../validators/authValidators.js";
import {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
} from "../utils/jwt.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || null,
  studentId: user.studentId || null,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new student account (role is always forced to "student")
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const { name, email, password, department, studentId } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "student",
      department,
      studentId,
    });

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and set HTTP-only JWT cookie
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Return currently authenticated user profile
 * @access  Authenticated
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authenticated user retrieved",
    data: {
      user: sanitizeUser(req.user),
    },
  });
};

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear authentication cookie
 * @access  Authenticated
 */
export const logout = async (_req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * @route   POST /api/v1/admin/users
 * @desc    Provision a maintenance staff or admin account (admin-only)
 * @access  Admin
 */
export const provisionUser = async (req, res, next) => {
  try {
    const parsed = provisionUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const { name, email, password, role, department } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
    });

    return res.status(201).json({
      success: true,
      message: `${role === "admin" ? "Admin" : "Staff"} account created successfully`,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};
