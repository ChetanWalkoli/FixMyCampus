import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Feedback";
import { FieldLabel } from "../../components/ui/FormFields";
import { resetPassword } from "../../services/authService";
import { evaluatePasswordStrength } from "./ActivateAccountPage";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing password reset token.");
      return;
    }

    if (!strength.isValid) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword({ token, password });
      setSuccessMessage(
        res.message || "Password reset successful. Redirecting to sign in..."
      );
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password. The link may be invalid or expired."
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
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a strong password for your FixMyCampus account.
          </p>

          {!token ? (
            <Alert className="mt-5">
              This password reset link is missing a token. Please request a new
              reset link.
            </Alert>
          ) : successMessage ? (
            <div className="mt-5 space-y-4">
              <Alert variant="success">{successMessage}</Alert>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Continue to Sign in
              </Link>
            </div>
          ) : (
            <>
              <Alert className="mt-5">{error}</Alert>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <FieldLabel htmlFor="password" className="mb-1.5">
                    New password
                  </FieldLabel>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 chars, upper, lower, number"
                      className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-3.5 pr-10 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="confirmPassword" className="mb-1.5">
                    Confirm password
                  </FieldLabel>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <KeyRound className="h-4 w-4" />
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
