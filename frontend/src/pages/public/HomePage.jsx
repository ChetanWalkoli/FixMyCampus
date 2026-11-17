import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import api from "../../services/api";
import { getDashboardPathByRole, useAuth } from "../../context/AuthContext";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Report an Issue",
    description:
      "Students log electrical, plumbing, network, or facility issues with exact room details and photo evidence.",
    icon: ClipboardCheck,
  },
  {
    step: "02",
    title: "Review & Assign",
    description:
      "Campus administrators triage incoming tickets, set priority, and assign active maintenance staff.",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "Resolve & Verify",
    description:
      "Technicians update repair progress, upload completion photos, and students confirm the fix.",
    icon: Wrench,
  },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [apiStatus, setApiStatus] = useState({
    state: "checking",
    message: "Checking service status...",
  });

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await api.get("/health");
        if (!isMounted) return;
        setApiStatus({
          state: "online",
          message: response.data?.message || "FixMyCampus API is running",
        });
      } catch {
        if (!isMounted) return;
        setApiStatus({
          state: "offline",
          message: "Service unavailable",
        });
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              FixMyCampus
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <Link
                to={getDashboardPathByRole(user.role)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <section className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Campus Operations &amp; Maintenance
          </p>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome to FixMyCampus
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Report campus infrastructure issues, track repair progress with
            unique ticket IDs, and keep students, administrators, and
            maintenance staff accountable from submission to sign-off.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isAuthenticated && user ? (
              <Link
                to={getDashboardPathByRole(user.role)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Open {user.role} Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Report an Issue
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Staff &amp; Admin Sign in
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {WORKFLOW_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-xl border border-slate-200/90 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-400">
                    {item.step}
                  </span>
                  <div className="rounded-md bg-blue-50 p-1.5 text-blue-700">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-900">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>FixMyCampus · Campus Maintenance Management</span>
          <span className="inline-flex items-center gap-1.5">
            {apiStatus.state === "online" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <span
                className={`h-2 w-2 rounded-full ${
                  apiStatus.state === "checking"
                    ? "bg-amber-400"
                    : "bg-rose-500"
                }`}
              />
            )}
            <span>{apiStatus.message}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
