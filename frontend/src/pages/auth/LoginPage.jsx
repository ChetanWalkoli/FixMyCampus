import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, LogIn } from "lucide-react";
import { getDashboardPathByRole, useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/ui/Feedback";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/FormFields";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    setIsSubmitting(true);

    try {
      const user = await login(formData);
      navigate(getDashboardPathByRole(user?.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to sign in. Please try again."
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
            Sign in to your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Access your Student, Admin, or Maintenance Staff portal.
          </p>

          <Alert className="mt-5">{error}</Alert>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@college.edu"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New student?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-700 hover:text-blue-800"
            >
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
