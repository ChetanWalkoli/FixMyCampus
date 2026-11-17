import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ProtectedRoute from "../routes/ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn((url) => {
      if (url === "/health") {
        return Promise.resolve({
          data: {
            success: true,
            message: "FixMyCampus API is running",
            environment: "test",
          },
        });
      }
      return Promise.reject({ response: { status: 401 } });
    }),
    post: vi.fn(),
  },
}));

describe("Phase 7 – Frontend Component & Route Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders HomePage with FixMyCampus branding and auth CTAs", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Welcome to FixMyCampus")).toBeInTheDocument();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("FixMyCampus API is running")
      ).toBeInTheDocument();
    });
  });

  it("renders LoginPage with email and password inputs", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders RegisterPage for students without any role selector", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Student Registration")).toBeInTheDocument();
    expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users from ProtectedRoute to /login", async () => {
    render(
      <MemoryRouter initialEntries={["/student"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Destination</div>} />
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              <Route path="/student" element={<div>Student Area</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Login Destination")).toBeInTheDocument();
    });
  });
});
