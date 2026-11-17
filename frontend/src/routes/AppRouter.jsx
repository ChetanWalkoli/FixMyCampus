import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import MyComplaintsPage from "../pages/student/MyComplaintsPage";
import NewComplaintPage from "../pages/student/NewComplaintPage";
import ComplaintDetailsPage from "../pages/student/ComplaintDetailsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import StaffDashboardPage from "../pages/staff/StaffDashboardPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

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
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route path="/staff" element={<StaffDashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
