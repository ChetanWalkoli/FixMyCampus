import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Feedback";
import { FieldLabel } from "../../components/ui/FormFields";
import { activateAccount } from "../../services/authService";

export const evaluatePasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score, isValid: score === 4 };
};

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing invitation token.");
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
      const res = await activateAccount({ token, password });
      setSuccessMessage(
        res.message || "Account activated successfully. Redirecting to sign in..."
      );
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to activate account. The invitation may be invalid or expired."
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
            Activate Your Account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Set a strong password to complete your FixMyCampus account setup.
          </p>

          {!token ? (
            <Alert className="mt-5">
              This activation link is missing a token. Please open the full link
              from your invitation email or ask an administrator to resend it.
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
                      placeholder="Create a strong password"
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

                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1 rounded-full ${
                              strength.score >= step
                                ? strength.score === 4
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <ul className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                        <li className={strength.checks.length ? "text-emerald-700" : ""}>
                          8+ characters
                        </li>
                        <li className={strength.checks.upper ? "text-emerald-700" : ""}>
                          Uppercase letter
                        </li>
                        <li className={strength.checks.lower ? "text-emerald-700" : ""}>
                          Lowercase letter
                        </li>
                        <li className={strength.checks.number ? "text-emerald-700" : ""}>
                          Number
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <FieldLabel htmlFor="confirmPassword" className="mb-1.5">
                    Confirm password
                  </FieldLabel>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-3.5 pr-10 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={
                        showConfirm
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    "Activating..."
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Activate Account
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Already activated?{" "}
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
