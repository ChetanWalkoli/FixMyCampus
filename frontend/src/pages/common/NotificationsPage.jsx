import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Circle } from "lucide-react";
import DashboardShell from "../../components/layout/DashboardShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Alert, EmptyState, LoadingRows } from "../../components/ui/Feedback";
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
      setError(err.response?.data?.message || "Unable to mark all as read.");
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
      subtitle="Updates on complaint assignments, status changes, and resolutions."
      actions={
        unreadCount > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )
      }
    >
      <Alert className="mb-5">{error}</Alert>

      <Card>
        {isLoading ? (
          <LoadingRows rows={4} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You are all caught up"
            description="No notifications yet."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((item) => {
              const link = getComplaintLink(item.complaint);
              return (
                <li
                  key={item._id}
                  className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    item.isRead ? "bg-white" : "bg-blue-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Circle
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${
                        item.isRead
                          ? "fill-slate-200 text-slate-200"
                          : "fill-blue-700 text-blue-700"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {item.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 tabular-nums">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-5 sm:pl-0">
                    {link && (
                      <Link
                        to={link}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                      >
                        View
                      </Link>
                    )}
                    {!item.isRead && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkRead(item._id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}
