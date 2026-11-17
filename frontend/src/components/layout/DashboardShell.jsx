import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ROLE_LABELS = {
  student: "Student Portal",
  admin: "Administrator Portal",
  staff: "Maintenance Staff Portal",
};

const ROLE_NAV_LINKS = {
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/complaints", label: "My Complaints", icon: ClipboardList },
    { to: "/student/complaints/new", label: "New Complaint", icon: PlusCircle },
  ],
  admin: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
  staff: [{ to: "/staff", label: "Dashboard", icon: LayoutDashboard, end: true }],
};

export default function DashboardShell({ title, subtitle, actions, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navLinks = ROLE_NAV_LINKS[user?.role] || [];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-semibold tracking-tight text-slate-900">
                  FixMyCampus
                </span>
                <p className="text-xs text-slate-500">
                  {ROLE_LABELS[user?.role] || "Portal"}
                </p>
              </div>
            </div>

            {navLinks.length > 0 && (
              <nav className="hidden items-center gap-1 md:flex">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user?.role}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isLoggingOut ? "Signing out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>

        {navLinks.length > 1 && (
          <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-6 py-2 md:hidden">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
