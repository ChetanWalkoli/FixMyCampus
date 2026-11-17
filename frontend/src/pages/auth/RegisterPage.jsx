import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, UserPlus } from "lucide-react";
import { getDashboardPathByRole, useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/ui/Feedback";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/FormFields";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    studentId: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register(formData);
      navigate(getDashboardPathByRole(user?.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check your details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            FixMyCampus
          </span>
        </Link>

        <Card className="p-6 sm:p-8">
          <h1 className="text-lg font-semibold text-slate-900">
            Student Registration
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a student account to submit and track campus maintenance
            requests.
          </p>

          <Alert className="mt-5">{error}</Alert>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input
              id="name"
              name="name"
              type="text"
              label="Full name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Chetan Walkoli"
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="College email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="student@college.edu"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="department"
                name="department"
                type="text"
                label="Department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Computer Eng."
              />

              <Input
                id="studentId"
                name="studentId"
                type="text"
                label="Student ID"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="TCOB59"
              />
            </div>

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              required
              minLength={8}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Creating account..." : "Create student account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-700 hover:text-blue-800"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
