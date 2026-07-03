"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/src/components/ui/StatusBadge";
import EmptyState from "@/src/components/ui/EmptyState";
import ThemeToggle from "@/src/components/ui/ThemeToggle";
import NotificationCenter from "@/src/components/ui/NotificationCenter";
import {
  DashboardSkeleton,
  TableSkeleton,
} from "@/src/components/ui/SkeletonLoader";
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  Clock,
  Users,
  LogOut,
  Search,
  Check,
  Eye,
  EyeOff,
  Pencil,
  X,
  CheckCircle2,
  XCircle,
  FileX,
  Inbox,
  CalendarOff,
  SlidersHorizontal,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const leaveTypes = ["Sick", "Casual", "Annual", "Work From Home", "Other"];
const statuses = ["Pending", "Approved", "Rejected"];

function createApi(token) {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) return detail[0]?.msg || "Request failed";
  return detail || "Request failed";
}

function isUnauthorized(error) {
  return error?.response?.status === 401;
}

function countWorkingDays(startDate, endDate) {
  if (!startDate || !endDate || endDate < startDate) return 0;
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getInitials(name, fallback = "U") {
  if (!name) return fallback;
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function activityIconClass(status) {
  const key = status?.toLowerCase();
  if (key === "approved") return "approved";
  if (key === "rejected") return "rejected";
  return "pending";
}

function ActivityStatusIcon({ status }) {
  const key = status?.toLowerCase();
  if (key === "approved") return <CheckCircle2 size={18} />;
  if (key === "rejected") return <XCircle size={18} />;
  return <Clock size={18} />;
}

function Toast({ message, title = "Notification", type = "success", onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className={`toast ${type}`}>
        <div className="toast-content">
          <p className="toast-title">{title}</p>
          <p className="toast-message">{message}</p>
        </div>
        <button
          type="button"
          className="toast-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="filter-chip">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label} filter`}>
        <X size={12} />
      </button>
    </span>
  );
}

function ButtonSpinner() {
  return <span className="btn-spinner" aria-hidden="true" />;
}

function notificationStorageKey(currentRole) {
  return `lms-notifications-${currentRole || "guest"}`;
}

function persistNotifications(currentRole, list) {
  if (!currentRole) return;
  localStorage.setItem(notificationStorageKey(currentRole), JSON.stringify(list));
}

export default function Home() {
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [notice, setNoticeMessage] = useState("");
  const [noticeMeta, setNoticeMeta] = useState({ title: "Notification", type: "success" });
  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const notify = useCallback(
    (message, options = {}) => {
      if (!message) {
        setNoticeMessage("");
        return;
      }

      const type = options.type || "success";
      const title =
        options.title ||
        (type === "error" ? "Error" : type === "warning" ? "Attention" : "Success");

      const item = {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => {
        const next = [item, ...prev].slice(0, 50);
        persistNotifications(role, next);
        return next;
      });
      setNoticeMessage(message);
      setNoticeMeta({ title, type });
    },
    [role],
  );

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
    setRole(localStorage.getItem("role") || "");
  }, []);

  useEffect(() => {
    if (!role) {
      setNotifications([]);
      return;
    }

    try {
      const saved = localStorage.getItem(notificationStorageKey(role));
      setNotifications(saved ? JSON.parse(saved) : []);
    } catch {
      setNotifications([]);
    }
  }, [role]);

  useEffect(() => {
    if (!token || !role) return;

    let cancelled = false;

    async function seedNotifications() {
      try {
        const saved = localStorage.getItem(notificationStorageKey(role));
        if (saved && JSON.parse(saved).length > 0) return;

        const endpoint = role === "manager" ? "/manager/dashboard" : "/leaves/dashboard";
        const response = await createApi(token).get(endpoint);
        if (cancelled) return;

        const data = response.data;
        const items = [];

        if (role === "manager" && data.pending > 0) {
          items.push({
            id: "seed-pending",
            title: "Pending approvals",
            message: `${data.pending} leave request${data.pending === 1 ? "" : "s"} need your review.`,
            type: "warning",
            read: false,
            createdAt: new Date().toISOString(),
          });
        }

        if (role === "employee" && data.pending > 0) {
          items.push({
            id: "seed-pending",
            title: "Leave pending",
            message: `${data.pending} of your leave request${data.pending === 1 ? "" : "s"} await approval.`,
            type: "warning",
            read: false,
            createdAt: new Date().toISOString(),
          });
        }

        data.recent?.slice(0, 2).forEach((leave) => {
          const status = leave.status?.toLowerCase();
          items.push({
            id: `seed-${leave.id}`,
            title: `${leave.leaveType} leave ${leave.status}`,
            message: `${formatDate(leave.startDate)} – ${formatDate(leave.endDate)}`,
            type:
              status === "approved" ? "success" : status === "rejected" ? "error" : "warning",
            read: true,
            createdAt: leave.createdAt || new Date().toISOString(),
          });
        });

        if (items.length) {
          setNotifications(items);
          persistNotifications(role, items);
        }
      } catch {
        // ignore seed errors
      }
    }

    seedNotifications();
    return () => {
      cancelled = true;
    };
  }, [token, role]);

  function handleLogin(data) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    setToken(data.access_token);
    setRole(data.role);
    setActivePage("dashboard");
    setPanelOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken("");
    setRole("");
    setActivePage("dashboard");
    setPanelOpen(false);
    setNotifications([]);
    setNoticeMessage("");
  }

  function handleUnauthorized() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken("");
    setRole("");
    setActivePage("dashboard");
    setPanelOpen(false);
    notify("Your session expired. Please log in again.", {
      type: "error",
      title: "Session expired",
    });
  }

  function handleMarkAllRead() {
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      persistNotifications(role, next);
      return next;
    });
  }

  function handleClearAll() {
    setNotifications([]);
    persistNotifications(role, []);
  }

  function handleRemoveNotification(id) {
    setNotifications((prev) => {
      const next = prev.filter((item) => item.id !== id);
      persistNotifications(role, next);
      return next;
    });
  }

  function handleNotificationSelect(id) {
    setNotifications((prev) => {
      const selected = prev.find((entry) => entry.id === id);
      if (selected?.id === "seed-pending") {
        setActivePage(role === "manager" ? "pending" : "history");
        setPanelOpen(false);
      }

      const next = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
      persistNotifications(role, next);
      return next;
    });
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} notice={notice} />;
  }

  const isManager = role === "manager";

  const navItems = isManager
    ? [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "pending", label: "Pending Requests", icon: Clock },
        { id: "employees", label: "Employee History", icon: Users },
      ]
    : [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "apply", label: "Apply Leave", icon: CalendarPlus },
        { id: "history", label: "Leave History", icon: History },
      ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="brand-mark">LMS</div>
          <span className="sidebar-logo-text">Leave Management</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${activePage === id ? "active" : ""}`}
              onClick={() => setActivePage(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{getInitials(isManager ? "Manager" : "Employee")}</div>
            <div className="user-info">
              <p className="user-name">{isManager ? "Manager Account" : "Employee Account"}</p>
              <span className="role-chip">{role}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <h2 className="topbar-title">{pageTitle(activePage, isManager)}</h2>
          <div className="topbar-actions">
            <ThemeToggle />
            <NotificationCenter
              notifications={notifications}
              open={panelOpen}
              onToggle={() => setPanelOpen((current) => !current)}
              onClose={() => setPanelOpen(false)}
              onMarkAllRead={handleMarkAllRead}
              onClearAll={handleClearAll}
              onRemove={handleRemoveNotification}
              onSelect={handleNotificationSelect}
            />
            <button
              type="button"
              className="secondary-button btn-label-hide-mobile"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span className="btn-label">Logout</span>
            </button>
          </div>
        </header>

        <Toast
          message={notice}
          title={noticeMeta.title}
          type={noticeMeta.type}
          onDismiss={() => setNoticeMessage("")}
        />

        <div className="page-content">
          {isManager ? (
            <ManagerView
              token={token}
              activePage={activePage}
              setNotice={notify}
              onUnauthorized={handleUnauthorized}
            />
          ) : (
            <EmployeeView
              token={token}
              activePage={activePage}
              setActivePage={setActivePage}
              setNotice={notify}
              onUnauthorized={handleUnauthorized}
            />
          )}
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`mobile-nav-item ${activePage === id ? "active" : ""}`}
            onClick={() => setActivePage(id)}
          >
            <Icon size={20} />
            <span>{label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function pageTitle(activePage, isManager) {
  if (activePage === "apply") return "Apply Leave";
  if (activePage === "history") return "Leave History";
  if (activePage === "pending") return "Pending Requests";
  if (activePage === "employees") return "Employee History";
  return isManager ? "Manager Dashboard" : "Employee Dashboard";
}

function LoginPage({ onLogin, notice }) {
  const [email, setEmail] = useState("employee@test.com");
  const [password, setPassword] = useState("employee123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [demoRole, setDemoRole] = useState("employee");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await createApi().post("/auth/login", {
        email,
        password,
      });
      onLogin(response.data);
    } catch (requestError) {
      setError(normalizeError(requestError));
    } finally {
      setLoading(false);
    }
  }

  function useDemoCredentials(type) {
    setDemoRole(type);
    if (type === "manager") {
      setEmail("manager@test.com");
      setPassword("manager123");
      return;
    }

    setEmail("employee@test.com");
    setPassword("employee123");
  }

  return (
    <main className="login-page">
      <div className="login-page-header">
        <ThemeToggle />
      </div>
      <section className="login-shell">
        <div className="login-intro">
          <div className="login-intro-content">
            <div className="login-logo">LMS</div>
            <h1 className="login-display">Leave, managed.</h1>
            <p className="login-subtitle">
              Track leave requests, approvals, and team history from one clean workspace.
            </p>
            <ul className="login-features">
              <li>
                <Check size={18} />
                Employee self-service leave requests
              </li>
              <li>
                <Check size={18} />
                Manager approvals in one click
              </li>
              <li>
                <Check size={18} />
                Live request history and tracking
              </li>
            </ul>
          </div>
        </div>
        <div className="login-form-panel">
          <form className="login-card" onSubmit={submit}>
            <div>
              <div className="login-logo">LMS</div>
              <h2 className="login-heading">Welcome back</h2>
              <p className="login-subtext">Sign in to your account</p>
            </div>
            <div className="demo-switcher" aria-label="Demo credentials">
              <button
                type="button"
                className={demoRole === "employee" ? "active" : ""}
                onClick={() => useDemoCredentials("employee")}
              >
                Employee
              </button>
              <button
                type="button"
                className={demoRole === "manager" ? "active" : ""}
                onClick={() => useDemoCredentials("manager")}
              >
                Manager
              </button>
            </div>
            {notice ? <div className="inline-alert">{notice}</div> : null}
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {error ? <div className="inline-alert">{error}</div> : null}
            <button
              className="primary-button full-width"
              disabled={loading}
              aria-disabled={loading}
            >
              {loading ? (
                <>
                  <ButtonSpinner />
                  Processing…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function EmployeeView({
  token,
  activePage,
  setActivePage,
  setNotice,
  onUnauthorized,
}) {
  if (activePage === "apply") {
    return (
      <ApplyLeave
        token={token}
        setNotice={setNotice}
        setActivePage={setActivePage}
        onUnauthorized={onUnauthorized}
      />
    );
  }
  if (activePage === "history") {
    return (
      <LeaveHistory
        token={token}
        setActivePage={setActivePage}
        setNotice={setNotice}
        onUnauthorized={onUnauthorized}
      />
    );
  }
  return <EmployeeDashboard token={token} setActivePage={setActivePage} onUnauthorized={onUnauthorized} />;
}

function ManagerView({ token, activePage, setNotice, onUnauthorized }) {
  if (activePage === "pending") {
    return (
      <PendingRequests
        token={token}
        setNotice={setNotice}
        onUnauthorized={onUnauthorized}
      />
    );
  }
  if (activePage === "employees") {
    return (
      <EmployeeHistory
        token={token}
        setNotice={setNotice}
        onUnauthorized={onUnauthorized}
      />
    );
  }
  return <ManagerDashboard token={token} onUnauthorized={onUnauthorized} />;
}

const metricIcons = {
  total: Users,
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

function MetricGrid({ metrics }) {
  return (
    <section className="metric-grid">
      {metrics.map((metric) => {
        const Icon = metricIcons[metric.iconKey] || Users;
        return (
          <article className="metric-card" key={metric.label}>
            <div className="metric-icon-box">
              <Icon size={20} />
            </div>
            <strong className="metric-value">{metric.value}</strong>
            <span className="metric-label">{metric.label}</span>
          </article>
        );
      })}
    </section>
  );
}

function EmployeeDashboard({ token, setActivePage, onUnauthorized }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await createApi(token).get("/leaves/dashboard");
        setDashboard(response.data);
      } catch (requestError) {
        if (isUnauthorized(requestError)) {
          onUnauthorized();
          return;
        }
        setError(normalizeError(requestError));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <EmptyState
        icon={FileX}
        title="Unable to load dashboard"
        subtitle={error}
      />
    );
  }
  if (!dashboard) {
    return (
      <EmptyState
        icon={Inbox}
        title="No dashboard data"
        subtitle="We couldn't find any dashboard information."
      />
    );
  }

  return (
    <div className="content-stack">
      <MetricGrid
        metrics={[
          { label: "Total Leaves", value: dashboard.total, iconKey: "total" },
          { label: "Pending", value: dashboard.pending, iconKey: "pending" },
          { label: "Approved", value: dashboard.approved, iconKey: "approved" },
          { label: "Rejected", value: dashboard.rejected, iconKey: "rejected" },
        ]}
      />
      <div className="dashboard-grid">
        <RecentLeaves title="Recent Activity" leaves={dashboard.recent} />
        <section className="card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="card-divider" />
          <div className="quick-actions">
            <button
              type="button"
              className="quick-action-btn"
              onClick={() => setActivePage("apply")}
            >
              <CalendarPlus size={18} />
              Apply for Leave
            </button>
            <button
              type="button"
              className="quick-action-btn"
              onClick={() => setActivePage("history")}
            >
              <History size={18} />
              View Leave History
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ManagerDashboard({ token, onUnauthorized }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await createApi(token).get("/manager/dashboard");
        setDashboard(response.data);
      } catch (requestError) {
        if (isUnauthorized(requestError)) {
          onUnauthorized();
          return;
        }
        setError(normalizeError(requestError));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <EmptyState
        icon={FileX}
        title="Unable to load dashboard"
        subtitle={error}
      />
    );
  }
  if (!dashboard) {
    return (
      <EmptyState
        icon={Inbox}
        title="No dashboard data"
        subtitle="We couldn't find any dashboard information."
      />
    );
  }

  return (
    <div className="content-stack">
      <MetricGrid
        metrics={[
          { label: "Total Employees", value: dashboard.totalEmployees, iconKey: "total" },
          { label: "Pending Requests", value: dashboard.pending, iconKey: "pending" },
          { label: "Approved", value: dashboard.approved, iconKey: "approved" },
          { label: "Rejected", value: dashboard.rejected, iconKey: "rejected" },
        ]}
      />
      <div className="dashboard-grid">
        <RecentLeaves title="Recent Activity" leaves={dashboard.recent} showEmployee />
        <section className="card">
          <h3 className="card-title">Pending Approvals</h3>
          <div className="card-divider" />
          <p style={{ margin: "0 0 8px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Requests awaiting your review
          </p>
          <div className="pending-count-badge">
            <Clock size={24} />
            {dashboard.pending}
          </div>
        </section>
      </div>
    </div>
  );
}

function RecentLeaves({ title, leaves, showEmployee = false }) {
  return (
    <section className="card">
      <h3 className="card-title">{title}</h3>
      <div className="card-divider" />
      {leaves?.length ? (
        <div className="activity-list">
          {leaves.map((leave) => (
            <div className="activity-row" key={leave.id}>
              <div className={`activity-icon ${activityIconClass(leave.status)}`}>
                <ActivityStatusIcon status={leave.status} />
              </div>
              <div className="activity-content">
                {showEmployee ? (
                  <strong>{leave.employee?.name || "Employee"}</strong>
                ) : null}
                <span>{leave.leaveType}</span>
              </div>
              <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                <StatusBadge status={leave.status} />
                <time className="activity-time">{formatDate(leave.createdAt)}</time>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarOff}
          title="No activity yet"
          subtitle="Leave requests will appear here once submitted."
        />
      )}
    </section>
  );
}

function ApplyLeave({ token, setNotice, setActivePage, onUnauthorized }) {
  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason.trim()) {
      setError("Please complete all fields.");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date must be on or after start date.");
      return;
    }

    setLoading(true);
    try {
      await createApi(token).post("/leaves", form);
      setNotice("Leave request submitted.", { title: "Leave submitted" });
      setActivePage("history");
    } catch (requestError) {
      if (isUnauthorized(requestError)) {
        onUnauthorized();
        return;
      }
      setError(normalizeError(requestError));
    } finally {
      setLoading(false);
    }
  }

  const workingDays = countWorkingDays(form.startDate, form.endDate);

  return (
    <div className="form-panel-wrap">
      <form className="form-panel" onSubmit={submit}>
        <div className="form-panel-header">
          <h3>Apply for Leave</h3>
        </div>
        <label>
          Leave Type
          <select
            value={form.leaveType}
            onChange={(event) => updateField("leaveType", event.target.value)}
            required
          >
            <option value="">Select leave type</option>
            {leaveTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <div className="two-column">
          <label>
            Start Date
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => updateField("startDate", event.target.value)}
              required
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => updateField("endDate", event.target.value)}
              required
            />
          </label>
        </div>
        {form.startDate && form.endDate ? (
          <span className="duration-chip">
            Duration: {workingDays} working day{workingDays === 1 ? "" : "s"}
          </span>
        ) : null}
        <label>
          Reason
          <textarea
            value={form.reason}
            onChange={(event) => updateField("reason", event.target.value)}
            rows={4}
            placeholder="Brief reason for your leave request"
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button
          className="primary-button full-width"
          disabled={loading}
          aria-disabled={loading}
        >
          {loading ? (
            <>
              <ButtonSpinner />
              Processing…
            </>
          ) : (
            "Submit Leave"
          )}
        </button>
        <button
          type="button"
          className="ghost-link"
          onClick={() => setActivePage("history")}
        >
          ← Back to History
        </button>
      </form>
    </div>
  );
}

function LeaveHistory({ token, setActivePage, setNotice, onUnauthorized }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const api = useMemo(() => createApi(token), [token]);

  async function load() {
    setLoading(true);
    try {
      const response = await api.get("/leaves", {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
        },
      });
      setLeaves(response.data);
    } catch (requestError) {
      if (isUnauthorized(requestError)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(requestError), { type: "error", title: "Load failed" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, statusFilter, typeFilter]);

  async function deleteLeave(leave) {
    if (!confirm("Cancel this leave request?")) return;

    try {
      await api.delete(`/leaves/${leave.id}`);
      setNotice("Leave request cancelled.", { title: "Leave cancelled" });
      load();
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(error), { type: "error", title: "Cancel failed" });
    }
  }

  async function saveEdit(form) {
    try {
      await api.put(`/leaves/${editing.id}`, form);
      setNotice("Leave request updated.", { title: "Leave updated" });
      setEditing(null);
      load();
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(error), { type: "error", title: "Update failed" });
    }
  }

  const hasActiveFilters = Boolean(search || statusFilter || typeFilter);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
  }

  return (
    <div className="content-stack">
      <section className="filters-panel">
        <div className="filters-panel-header">
          <div className="filters-panel-meta">
            <SlidersHorizontal size={16} />
            <span>Filter &amp; search</span>
            {!loading ? (
              <span className="results-count">
                {leaves.length} {leaves.length === 1 ? "result" : "results"}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="primary-button filters-action-btn"
            onClick={() => setActivePage("apply")}
          >
            <CalendarPlus size={16} />
            Apply for Leave
          </button>
        </div>
        <div className="filters-panel-body">
          <div className="filter-field filter-field-grow">
            <span className="filter-label">Search</span>
            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search by leave type or reason…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search leave requests"
              />
            </div>
          </div>
          <div className="filter-field">
            <span className="filter-label">Status</span>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {statuses.map((statusValue) => (
                <option key={statusValue} value={statusValue}>
                  {statusValue}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <span className="filter-label">Leave type</span>
            <select
              className="filter-select"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter by leave type"
            >
              <option value="">All types</option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              className="secondary-button filter-clear-btn"
              onClick={clearFilters}
            >
              <X size={14} />
              Clear
            </button>
          ) : null}
        </div>
        {hasActiveFilters ? (
          <div className="filter-chips">
            {search ? (
              <FilterChip label={`Search: ${search}`} onRemove={() => setSearch("")} />
            ) : null}
            {statusFilter ? (
              <FilterChip
                label={`Status: ${statusFilter}`}
                onRemove={() => setStatusFilter("")}
              />
            ) : null}
            {typeFilter ? (
              <FilterChip label={`Type: ${typeFilter}`} onRemove={() => setTypeFilter("")} />
            ) : null}
          </div>
        ) : null}
      </section>
      {loading ? (
        <TableSkeleton />
      ) : (
        <LeaveTable
          leaves={leaves}
          onEdit={setEditing}
          onDelete={deleteLeave}
          hasActiveFilters={hasActiveFilters}
        />
      )}
      {editing ? (
        <EditLeaveDialog leave={editing} onCancel={() => setEditing(null)} onSave={saveEdit} />
      ) : null}
    </div>
  );
}

function LeaveTable({ leaves, onEdit, onDelete, hasActiveFilters = false }) {
  if (!leaves.length) {
    return (
      <EmptyState
        icon={hasActiveFilters ? Search : Inbox}
        title={hasActiveFilters ? "No matching requests" : "No leave requests"}
        subtitle={
          hasActiveFilters
            ? "Try different keywords or clear your filters to see all records."
            : "You haven't submitted any leave requests yet."
        }
      />
    );
  }

  return (
    <>
      <div className="table-wrap has-mobile-cards">
        <table>
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave.id}>
                <td>{leave.leaveType}</td>
                <td className="mono">{formatDate(leave.startDate)}</td>
                <td className="mono">{formatDate(leave.endDate)}</td>
                <td>
                  <StatusBadge status={leave.status} />
                </td>
                <td className="actions-cell">
                  {leave.status === "Pending" ? (
                    <>
                      <button
                        type="button"
                        className="action-icon-btn"
                        onClick={() => onEdit(leave)}
                        aria-label="Edit leave request"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="action-icon-btn danger"
                        onClick={() => onDelete(leave)}
                        aria-label="Cancel leave request"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <span className="mono" style={{ color: "var(--text-muted)" }}>
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="leave-cards">
        {leaves.map((leave) => (
          <article className="leave-card" key={leave.id}>
            <div className="leave-card-header">
              <span className="leave-card-type">{leave.leaveType}</span>
              <StatusBadge status={leave.status} />
            </div>
            <div className="leave-card-meta">
              <span>
                {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
              </span>
              {leave.reason ? <span>{leave.reason}</span> : null}
            </div>
            {leave.status === "Pending" ? (
              <div className="leave-card-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onEdit(leave)}
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => onDelete(leave)}
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}

function EditLeaveDialog({ leave, onCancel, onSave }) {
  const [form, setForm] = useState({
    leaveType: leave.leaveType,
    startDate: leave.startDate?.slice(0, 10),
    endDate: leave.endDate?.slice(0, 10),
    reason: leave.reason,
  });
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.reason.trim()) {
      setError("Reason is required.");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date must be on or after start date.");
      return;
    }
    onSave(form);
  }

  return (
    <div className="modal-backdrop">
      <form className="modal-panel" onSubmit={submit}>
        <div className="modal-header">
          <h3>Edit Leave</h3>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <label>
            Leave Type
            <select
              value={form.leaveType}
              onChange={(event) => updateField("leaveType", event.target.value)}
            >
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <div className="two-column">
            <label>
              Start Date
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
              />
            </label>
            <label>
              End Date
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
              />
            </label>
          </div>
          <label>
            Reason
            <textarea
              value={form.reason}
              onChange={(event) => updateField("reason", event.target.value)}
              rows={4}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

function PendingRequests({ token, setNotice, onUnauthorized }) {
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const api = useMemo(() => createApi(token), [token]);

  async function load() {
    setLoading(true);
    try {
      const response = await api.get("/manager/pending");
      setLeaves(response.data);
    } catch (requestError) {
      if (isUnauthorized(requestError)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(requestError), { type: "error", title: "Load failed" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(leave) {
    try {
      await api.put(`/manager/approve/${leave.id}`);
      setNotice("Leave approved.", { title: "Leave approved" });
      setSelectedLeave(null);
      load();
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(error), { type: "error", title: "Approval failed" });
    }
  }

  async function reject(leave) {
    if (!comment.trim()) {
      setNotice("Comment is required.", { type: "error", title: "Rejection comment" });
      return;
    }
    try {
      await api.put(`/manager/reject/${leave.id}`, { comment });
      setNotice("Leave rejected.", { title: "Leave rejected", type: "warning" });
      setComment("");
      setSelectedLeave(null);
      load();
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(error), { type: "error", title: "Rejection failed" });
    }
  }

  if (loading) return <TableSkeleton />;

  return (
    <div className="content-stack">
      <section className="filters-panel filters-panel--compact">
        <div className="filters-panel-header">
          <div className="filters-panel-meta">
            <Clock size={16} />
            <span>Pending approvals</span>
            <span className="page-header-badge">
              {leaves.length} pending
            </span>
          </div>
        </div>
      </section>
      {leaves.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.employee?.name || "Employee"}</td>
                  <td>{leave.leaveType}</td>
                  <td className="mono">{formatDate(leave.startDate)}</td>
                  <td className="mono">{formatDate(leave.endDate)}</td>
                  <td>{leave.reason}</td>
                  <td>
                    <StatusBadge status={leave.status} />
                  </td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="action-icon-btn success"
                      onClick={() => approve(leave)}
                      aria-label={`Approve leave for ${leave.employee?.name || "employee"}`}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="action-icon-btn danger"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setComment("");
                      }}
                      aria-label={`Reject leave for ${leave.employee?.name || "employee"}`}
                    >
                      <XCircle size={16} />
                    </button>
                    <button
                      type="button"
                      className="action-icon-btn"
                      onClick={() => setSelectedLeave(leave)}
                      aria-label="View leave details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title="All caught up"
          subtitle="No pending leave requests need your review."
        />
      )}

      {selectedLeave ? (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => setSelectedLeave(null)}
            aria-hidden="true"
          />
          <div className="drawer-panel" role="dialog" aria-modal="true">
            <div className="drawer-header">
              <div className="user-avatar">
                {getInitials(selectedLeave.employee?.name, "E")}
              </div>
              <div className="drawer-header-info">
                <h3>{selectedLeave.employee?.name || "Employee"}</h3>
                <p>{selectedLeave.employee?.department || "No department"}</p>
              </div>
              <StatusBadge status={selectedLeave.status} />
              <button
                type="button"
                className="icon-button"
                onClick={() => setSelectedLeave(null)}
                aria-label="Close drawer"
                style={{ marginLeft: "auto" }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="drawer-body">
              <section>
                <h4 className="detail-section-title">Leave Information</h4>
                <dl className="detail-grid">
                  <div className="detail-row">
                    <dt>Type</dt>
                    <dd>{selectedLeave.leaveType}</dd>
                  </div>
                  <div className="detail-row">
                    <dt>Start</dt>
                    <dd className="mono">{formatDate(selectedLeave.startDate)}</dd>
                  </div>
                  <div className="detail-row">
                    <dt>End</dt>
                    <dd className="mono">{formatDate(selectedLeave.endDate)}</dd>
                  </div>
                  <div className="detail-row">
                    <dt>Duration</dt>
                    <dd>
                      {countWorkingDays(
                        selectedLeave.startDate?.slice(0, 10),
                        selectedLeave.endDate?.slice(0, 10),
                      )}{" "}
                      working days
                    </dd>
                  </div>
                </dl>
              </section>
              <section>
                <h4 className="detail-section-title">Reason</h4>
                <div className="reason-block">{selectedLeave.reason}</div>
              </section>
              <section>
                <h4 className="detail-section-title">Timeline</h4>
                <div className="timeline">
                  <div className="timeline-item">
                    <span className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-label">Applied</div>
                      <div className="timeline-time">
                        {formatDate(selectedLeave.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <span
                      className="timeline-dot"
                      style={{
                        background:
                          selectedLeave.status === "Pending"
                            ? "var(--warning)"
                            : "var(--text-muted)",
                      }}
                    />
                    <div className="timeline-content">
                      <div className="timeline-label">Awaiting review</div>
                      <div className="timeline-time">Pending manager action</div>
                    </div>
                  </div>
                </div>
              </section>
              <section>
                <h4 className="detail-section-title">Manager Action</h4>
                <label>
                  Rejection Comment
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Required if rejecting this request"
                  />
                </label>
              </section>
            </div>
            <div className="drawer-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedLeave(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => reject(selectedLeave)}
              >
                <XCircle size={16} />
                Reject
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => approve(selectedLeave)}
              >
                <CheckCircle2 size={16} />
                Approve
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function EmployeeHistory({ token, setNotice, onUnauthorized }) {
  const [employees, setEmployees] = useState([]);
  const [history, setHistory] = useState(null);
  const [filters, setFilters] = useState({ name: "", email: "", department: "" });
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => createApi(token), [token]);

  async function search() {
    setLoading(true);
    try {
      const response = await api.get("/manager/search", {
        params: {
          name: filters.name || undefined,
          email: filters.email || undefined,
          department: filters.department || undefined,
        },
      });
      setEmployees(response.data);
    } catch (requestError) {
      if (isUnauthorized(requestError)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(requestError), { type: "error", title: "Load failed" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search();
  }, []);

  async function loadHistory(employee) {
    try {
      const response = await api.get(`/manager/employee/${employee.id}/history`);
      setHistory(response.data);
    } catch (requestError) {
      if (isUnauthorized(requestError)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(requestError), { type: "error", title: "Load failed" });
    }
  }

  return (
    <div className="content-stack">
      <section className="filters-panel">
        <div className="filters-panel-header">
          <div className="filters-panel-meta">
            <SlidersHorizontal size={16} />
            <span>Find employees</span>
          </div>
          <button type="button" className="primary-button filters-action-btn" onClick={search}>
            <Search size={16} />
            Search
          </button>
        </div>
        <div className="filters-panel-body filters-panel-body--three">
          <div className="filter-field filter-field-grow">
            <span className="filter-label">Name</span>
            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search by name…"
                value={filters.name}
                onChange={(event) => setFilters({ ...filters, name: event.target.value })}
                aria-label="Search by employee name"
              />
            </div>
          </div>
          <div className="filter-field">
            <span className="filter-label">Email</span>
            <input
              type="search"
              placeholder="Email address"
              value={filters.email}
              onChange={(event) => setFilters({ ...filters, email: event.target.value })}
              aria-label="Filter by email"
            />
          </div>
          <div className="filter-field">
            <span className="filter-label">Department</span>
            <input
              type="search"
              placeholder="Department"
              value={filters.department}
              onChange={(event) =>
                setFilters({ ...filters, department: event.target.value })
              }
              aria-label="Filter by department"
            />
          </div>
        </div>
      </section>
      {loading ? (
        <TableSkeleton />
      ) : employees.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td className="mono">{employee.email}</td>
                  <td>{employee.department}</td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => loadHistory(employee)}
                    >
                      <History size={14} />
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No employees found"
          subtitle="Try adjusting your search filters."
        />
      )}
      {history ? (
        <section className="card">
          <div className="card-header">
            <h3 className="card-title">{history.employee.name}</h3>
          </div>
          <div className="card-divider" />
          {history.leaves.length ? (
            <div className="table-wrap" style={{ border: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Status</th>
                    <th>Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {history.leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.leaveType}</td>
                      <td>
                        <StatusBadge status={leave.status} />
                      </td>
                      <td className="mono">
                        {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={CalendarOff}
              title="No leave history"
              subtitle="This employee hasn't submitted any leave requests."
            />
          )}
        </section>
      ) : null}
    </div>
  );
}
