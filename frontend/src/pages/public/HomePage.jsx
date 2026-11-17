import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, AlertCircle, Wrench } from "lucide-react";
import api from "../../services/api";
import { getDashboardPathByRole, useAuth } from "../../context/AuthContext";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [apiStatus, setApiStatus] = useState({
    state: "checking",
    message: "Checking API connection...",
    environment: null,
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
          environment: response.data?.environment || import.meta.env.MODE,
        });
      } catch {
        if (!isMounted) return;
        setApiStatus({
          state: "offline",
          message: "Backend API unreachable",
          environment: import.meta.env.MODE,
        });
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              FixMyCampus
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:inline-flex">
              <Wrench className="h-3.5 w-3.5" />
              Phase 1 · {import.meta.env.MODE}
            </span>
            {isAuthenticated && user ? (
              <Link
                to={getDashboardPathByRole(user.role)}
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xs sm:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Campus Maintenance &amp; Complaint Management
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Welcome to FixMyCampus
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              A centralized platform for reporting, assigning, tracking, and
              resolving infrastructure-related issues across educational
              campuses. Built for students, administrators, and maintenance
              staff.
            </p>
          </div>

          <div className="mt-8 grid gap-4 border-t border-slate-100 pt-8 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Development Environment
              </p>
              <p className="mt-1.5 text-sm font-semibold text-slate-900">
                Frontend: React + Vite ({import.meta.env.MODE})
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                API Base:{" "}
                {import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Backend API Status
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                {apiStatus.state === "online" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle
                    className={`h-4 w-4 ${
                      apiStatus.state === "checking"
                        ? "text-amber-500"
                        : "text-rose-500"
                    }`}
                  />
                )}
                <span className="text-sm font-semibold text-slate-900">
                  {apiStatus.message}
                </span>
              </div>
              {apiStatus.environment && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Environment: {apiStatus.environment}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
