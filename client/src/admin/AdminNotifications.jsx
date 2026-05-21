import { Bell, CreditCard, UserPlus, XCircle } from "lucide-react";
import { useNotificationContext } from "../context/NotificationContext";
import { formatDate } from "../utils/dateHelpers";

const icons = {
  new_booking: Bell,
  cancellation: XCircle,
  new_user: UserPlus,
  payment: CreditCard,
};

const AdminNotifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationContext();

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3>Notifications</h3>
            <span>{unreadCount} unread</span>
          </div>
          <button type="button" className="btn btn-outline" onClick={markAllAsRead}>
            Mark all as read
          </button>
        </div>
        <div className="activity-feed">
          {notifications.map((notification) => {
            const Icon = icons[notification.type] || Bell;
            return (
              <button
                key={notification.id}
                type="button"
                className={`notification-card ${notification.isRead ? "" : "unread"}`}
                onClick={() => markAsRead(notification.id)}
              >
                <Icon size={18} />
                <div>
                  <strong>{notification.message}</strong>
                  <small>{formatDate(notification.createdAt, "dd MMM yyyy, hh:mm a")}</small>
                </div>
              </button>
            );
          })}
          {!notifications.length && <p>No notifications yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default AdminNotifications;

