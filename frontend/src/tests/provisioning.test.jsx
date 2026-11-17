import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ActivateAccountPage from "../pages/auth/ActivateAccountPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import AdminStaffPage from "../pages/admin/AdminStaffPage";
import { AuthProvider } from "../context/AuthContext";

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiPatch = vi.fn();
const mockApiDelete = vi.fn();

vi.mock("../services/api", () => ({
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
    patch: (...args) => mockApiPatch(...args),
    delete: (...args) => mockApiDelete(...args),
  },
}));

describe("Phase F & G – Provisioning, Activation & Password Reset UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockImplementation((url) => {
      if (url === "/auth/me") {
        return Promise.resolve({
          data: {
            data: {
              user: {
                id: "1",
                name: "Chief Admin",
                email: "admin@college.edu",
                role: "admin",
              },
            },
          },
        });
      }
      if (url === "/notifications") {
        return Promise.resolve({
          data: { data: { notifications: [], unreadCount: 0 } },
        });
      }
      if (url === "/admin/users") {
        return Promise.resolve({
          data: {
            data: {
              users: [
                {
                  _id: "u1",
                  name: "Chief Admin",
                  email: "admin@college.edu",
                  role: "admin",
                  department: "Administration",
                  isActive: true,
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          },
        });
      }
      if (url === "/admin/invitations") {
        return Promise.resolve({
          data: {
            data: {
              invitations: [
                {
                  _id: "inv1",
                  name: "Pending Electrician",
                  email: "elec@college.edu",
                  role: "staff",
                  department: "Electrical",
                  status: "pending",
                  expiresAt: new Date(Date.now() + 86400000).toISOString(),
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
  });

  it("shows missing token error on ActivateAccountPage when token is absent", () => {
    render(
      <MemoryRouter initialEntries={["/activate-account"]}>
        <ActivateAccountPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/missing a token/i)).toBeInTheDocument();
  });

  it("validates password mismatch and activates account with valid token", async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { message: "Account activated successfully." },
    });

    render(
      <MemoryRouter initialEntries={["/activate-account?token=validtoken12345"]}>
        <ActivateAccountPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongPass1" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "DifferentPass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /activate account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "StrongPass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /activate account/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/auth/activate-account", {
        token: "validtoken12345",
        password: "StrongPass1",
      });
    });
  });

  it("submits ForgotPasswordPage and displays generic confirmation", async () => {
    mockApiPost.mockResolvedValueOnce({
      data: {
        message:
          "If an active account with that email exists, a password reset link has been sent.",
      },
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@college.edu" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/if an active account with that email exists/i)
      ).toBeInTheDocument();
    });
  });

  it("renders ResetPasswordPage and rejects missing token", () => {
    render(
      <MemoryRouter initialEntries={["/reset-password"]}>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/missing a token/i)).toBeInTheDocument();
  });

  it("renders AdminStaffPage pending invitations and opens invite form", async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { message: "Invitation sent to staff2@college.edu" },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminStaffPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Pending Electrician")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /resend/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /revoke/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /invite staff \/ admin/i })
    );

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Staff Two" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "staff2@college.edu" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/admin/users/invite",
        expect.objectContaining({
          name: "Staff Two",
          email: "staff2@college.edu",
          role: "staff",
        })
      );
    });
  });
});
