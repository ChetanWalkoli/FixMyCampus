import env from "../config/env.js";
import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../services/emailService.js";
import { generateSecureToken, hashToken } from "../utils/cryptoTokens.js";
import {
  clearAuthCookie,
  generateToken,
  setAuthCookie,
} from "../utils/jwt.js";
import {
  activateAccountSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  formatZodError,
  loginSchema,
  provisionUserSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/authValidators.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || null,
  studentId: user.studentId || null,
  employeeId: user.employeeId || null,
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
 * @route   POST /api/v1/auth/activate-account
 * @desc    Activate an invited Staff or Admin account using a single-use token
 * @access  Public
 */
export const activateAccount = async (req, res, next) => {
  try {
    const parsed = activateAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    // Atomically claim a valid, pending, unexpired invitation
    const invitation = await Invitation.findOneAndUpdate(
      {
        tokenHash,
        status: "pending",
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          status: "accepted",
          acceptedAt: new Date(),
        },
      },
      { returnDocument: "before" }
    );

    if (!invitation) {
      const existing = await Invitation.findOne({ tokenHash });
      if (existing && existing.status === "accepted") {
        return res.status(400).json({
          success: false,
          message: "This invitation has already been used",
        });
      }
      if (existing && existing.status === "revoked") {
        return res.status(400).json({
          success: false,
          message: "This invitation has been revoked by an administrator",
        });
      }
      if (existing && existing.expiresAt <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "This invitation link has expired",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid or expired invitation token",
      });
    }

    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name: invitation.name,
      email: invitation.email,
      password,
      role: invitation.role,
      department: invitation.department,
      employeeId: invitation.employeeId,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Account activated successfully. You can now sign in.",
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset link if email exists (non-enumerating response)
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const { email } = parsed.data;
    const genericMessage =
      "If an active account with that email exists, a password reset link has been sent.";

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresMinutes = env.passwordResetExpiresMinutes;

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(
      Date.now() + expiresMinutes * 60 * 1000
    );
    await user.save();

    const resetUrl = `${env.frontendUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresMinutes,
      });
    } catch (emailErr) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      return next(emailErr);
    }

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using single-use reset token and invalidate existing sessions
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    // Atomically clear reset token so it cannot be reused
    const user = await User.findOneAndUpdate(
      {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
        isActive: true,
      },
      {
        $unset: {
          passwordResetTokenHash: 1,
          passwordResetExpiresAt: 1,
        },
      },
      { returnDocument: "before" }
    ).select("+passwordResetTokenHash +passwordResetExpiresAt");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    user.password = password;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    clearAuthCookie(res);

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please sign in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/auth/change-password
 * @desc    Change password for authenticated user and rotate session token version
 * @access  Authenticated
 */
export const changePassword = async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: formatZodError(parsed.error),
      });
    }

    const { currentPassword, newPassword } = parsed.data;
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    const newJwt = generateToken(user);
    setAuthCookie(res, newJwt);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
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
