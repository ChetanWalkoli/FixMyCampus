import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Mail } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Feedback";
import { Input } from "../../components/ui/FormFields";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const res = await forgotPassword({ email });
      setSuccessMessage(
        res.message ||
          "If an active account with that email exists, a password reset link has been sent."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process request. Please try again."
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
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your account email and we will send you a password reset link.
          </p>

          <Alert className="mt-5">{error}</Alert>
          <Alert variant="success" className="mt-5">
            {successMessage}
          </Alert>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <Mail className="h-4 w-4" />
              {isSubmitting ? "Sending link..." : "Send Reset Link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Remember your password?{" "}
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
