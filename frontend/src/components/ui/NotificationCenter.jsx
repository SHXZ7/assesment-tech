"use client";

import { useEffect, useRef } from "react";
import { Bell, CheckCircle2, Clock, X, XCircle } from "lucide-react";

function formatRelativeTime(iso) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function NotificationIcon({ type }) {
  if (type === "error") return <XCircle size={16} />;
  if (type === "warning") return <Clock size={16} />;
  return <CheckCircle2 size={16} />;
}

export default function NotificationCenter({
  notifications,
  open,
  onToggle,
  onClose,
  onMarkAllRead,
  onClearAll,
  onRemove,
  onSelect,
}) {
  const panelRef = useRef(null);
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  return (
    <div className="notification-center" ref={panelRef}>
      <button
        type="button"
        className={`icon-button notification-bell ${open ? "active" : ""}`}
        onClick={onToggle}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="notification-badge" aria-label={`${unreadCount} unread`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-panel" role="dialog" aria-label="Notifications">
          <div className="notification-panel-header">
            <div>
              <h3>Notifications</h3>
              {unreadCount > 0 ? (
                <p className="notification-panel-subtitle">{unreadCount} unread</p>
              ) : null}
            </div>
            <div className="notification-panel-actions">
              {unreadCount > 0 ? (
                <button type="button" className="notification-text-btn" onClick={onMarkAllRead}>
                  Mark all read
                </button>
              ) : null}
              {notifications.length > 0 ? (
                <button type="button" className="notification-text-btn" onClick={onClearAll}>
                  Clear all
                </button>
              ) : null}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length ? (
              notifications.map((item) => (
                <article
                  key={item.id}
                  className={`notification-item ${item.type} ${item.read ? "read" : "unread"}`}
                >
                  <button
                    type="button"
                    className="notification-item-body"
                    onClick={() => onSelect(item.id)}
                  >
                    <span className={`notification-item-icon ${item.type}`}>
                      <NotificationIcon type={item.type} />
                    </span>
                    <span className="notification-item-content">
                      <span className="notification-item-title">{item.title}</span>
                      <span className="notification-item-message">{item.message}</span>
                      <time className="notification-item-time">
                        {formatRelativeTime(item.createdAt)}
                      </time>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="notification-item-dismiss"
                    onClick={() => onRemove(item.id)}
                    aria-label="Dismiss notification"
                  >
                    <X size={14} />
                  </button>
                </article>
              ))
            ) : (
              <div className="notification-empty">
                <Bell size={32} strokeWidth={1.25} />
                <p>No notifications yet</p>
                <span>Updates about your leave requests will appear here.</span>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
