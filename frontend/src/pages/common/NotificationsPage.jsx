import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Bell, CheckCheck, Circle } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getNotifications();
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load notifications."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update notification."
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to mark all as read."
      );
    }
  };

  const getComplaintLink = (complaintObj) => {
    if (!complaintObj?._id) return null;
    if (user?.role === "student")
      return `/student/complaints/${complaintObj._id}`;
    if (user?.role === "admin") return `/admin/complaints/${complaintObj._id}`;
    if (user?.role === "staff") return `/staff/tasks/${complaintObj._id}`;
    return null;
  };

  return (
    <DashboardShell
      title="Notifications"
      subtitle="Stay updated on complaint assignments, status changes, and resolutions."
      actions={
        unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )
      }
    >
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-900">
              You are all caught up
            </p>
            <p className="mt-1 text-sm text-slate-500">
              No notifications yet.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((item) => {
              const link = getComplaintLink(item.complaint);
              return (
                <li
                  key={item._id}
                  className={`flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    item.isRead ? "bg-white" : "bg-indigo-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Circle
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${
                        item.isRead
                          ? "fill-slate-200 text-slate-200"
                          : "fill-indigo-600 text-indigo-600"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {item.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-5 sm:pl-0">
                    {link && (
                      <Link
                        to={link}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        View
                      </Link>
                    )}
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(item._id)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
