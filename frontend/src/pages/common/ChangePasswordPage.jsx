import { useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Feedback";
import { Input } from "../../components/ui/FormFields";
import { changePassword } from "../../services/authService";
import { evaluatePasswordStrength } from "../auth/ActivateAccountPage";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const strength = useMemo(
    () => evaluatePasswordStrength(newPassword),
    [newPassword]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!strength.isValid) {
      setError(
        "New password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword({ currentPassword, newPassword });
      setSuccessMessage(res.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell
      title="Change Password"
      subtitle="Update your account password. Other active sessions will be signed out."
    >
      <Card className="mx-auto max-w-lg p-6 sm:p-8">
        <Alert className="mb-5">{error}</Alert>
        <Alert variant="success" className="mb-5">
          {successMessage}
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="currentPassword"
            type="password"
            label="Current password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />

          <Input
            id="newPassword"
            type="password"
            label="New password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 chars, upper, lower, number"
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm new password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
          />

          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <KeyRound className="h-4 w-4" />
              {isSubmitting ? "Updating password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Card>
    </DashboardShell>
  );
}
