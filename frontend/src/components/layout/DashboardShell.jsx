import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNotifications } from "../../services/notificationService";

const ROLE_LABELS = {
  student: "Student Portal",
  admin: "Admin Operations",
  staff: "Maintenance Staff",
};

const ROLE_NAV_LINKS = {
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/complaints", label: "My Complaints", icon: ClipboardList },
    { to: "/student/complaints/new", label: "New Complaint", icon: PlusCircle },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/complaints", label: "All Complaints", icon: ClipboardList },
    { to: "/admin/staff", label: "Staff Directory", icon: Users },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
  staff: [
    { to: "/staff", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/staff/tasks", label: "My Tasks", icon: ClipboardList },
    { to: "/staff/history", label: "Work History", icon: History },
  ],
};

function SidebarContent({
  user,
  navLinks,
  unreadCount,
  isLoggingOut,
  onLogout,
  onNavigate,
}) {
  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <span className="block text-sm font-semibold tracking-tight text-slate-900">
            FixMyCampus
          </span>
          <span className="block truncate text-[11px] font-medium text-slate-500">
            {ROLE_LABELS[user?.role] || "Portal"}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <NavLink
          to="/notifications"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            }`
          }
        >
          <span className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 shrink-0" />
            <span>Notifications</span>
          </span>
          {unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1.5 text-[11px] font-semibold text-white tabular-nums">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </NavLink>
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-slate-900">
            {user?.name}
          </p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
        <NavLink
          to="/change-password"
          onClick={onNavigate}
          className={({ isActive }) =>
            `mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          <span>Change password</span>
        </NavLink>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardShell({ title, subtitle, actions, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadUnread = async () => {
      try {
        const res = await getNotifications();
        if (isMounted) setUnreadCount(res.data?.unreadCount || 0);
      } catch {
        // Ignore badge polling error
      }
    };
    loadUnread();
    return () => {
      isMounted = false;
    };
  }, []);

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
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:w-60 lg:flex-col">
        <SidebarContent
          user={user}
          navLinks={navLinks}
          unreadCount={unreadCount}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[80vw]">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-4 rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
              user={user}
              navLinks={navLinks}
              unreadCount={unreadCount}
              isLoggingOut={isLoggingOut}
              onLogout={handleLogout}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-h-screen flex-col lg:pl-60">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-slate-900">
              FixMyCampus
            </span>
          </div>
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white tabular-nums">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
