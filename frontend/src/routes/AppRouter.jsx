import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ActivateAccountPage from "../pages/auth/ActivateAccountPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import ChangePasswordPage from "../pages/common/ChangePasswordPage";
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import MyComplaintsPage from "../pages/student/MyComplaintsPage";
import NewComplaintPage from "../pages/student/NewComplaintPage";
import ComplaintDetailsPage from "../pages/student/ComplaintDetailsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminComplaintsPage from "../pages/admin/AdminComplaintsPage";
import AdminComplaintDetailsPage from "../pages/admin/AdminComplaintDetailsPage";
import AdminStaffPage from "../pages/admin/AdminStaffPage";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage";
import StaffDashboardPage from "../pages/staff/StaffDashboardPage";
import StaffTasksPage from "../pages/staff/StaffTasksPage";
import StaffTaskDetailsPage from "../pages/staff/StaffTaskDetailsPage";
import StaffHistoryPage from "../pages/staff/StaffHistoryPage";
import NotificationsPage from "../pages/common/NotificationsPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/activate-account" element={<ActivateAccountPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student" element={<StudentDashboardPage />} />
          <Route path="/student/complaints" element={<MyComplaintsPage />} />
          <Route
            path="/student/complaints/new"
            element={<NewComplaintPage />}
          />
          <Route
            path="/student/complaints/:id"
            element={<ComplaintDetailsPage />}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
          <Route
            path="/admin/complaints/:id"
            element={<AdminComplaintDetailsPage />}
          />
          <Route path="/admin/staff" element={<AdminStaffPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route path="/staff" element={<StaffDashboardPage />} />
          <Route path="/staff/tasks" element={<StaffTasksPage />} />
          <Route path="/staff/tasks/:id" element={<StaffTaskDetailsPage />} />
          <Route path="/staff/history" element={<StaffHistoryPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["student", "admin", "staff"]} />
          }
        >
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
