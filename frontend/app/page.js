"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";

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

export default function Home() {
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
    setRole(localStorage.getItem("role") || "");
  }, []);

  function handleLogin(data) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    setToken(data.access_token);
    setRole(data.role);
    setActivePage("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken("");
    setRole("");
    setActivePage("dashboard");
  }

  function handleUnauthorized() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken("");
    setRole("");
    setActivePage("dashboard");
    setNotice("Your session expired. Please log in again.");
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} notice={notice} />;
  }

  const isManager = role === "manager";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">LM</div>
          <div>
            <p className="eyebrow">Leave Management</p>
            <h1>{isManager ? "Manager" : "Employee"}</h1>
          </div>
        </div>
        <nav>
          <button
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>
          {isManager ? (
            <>
              <button
                className={activePage === "pending" ? "active" : ""}
                onClick={() => setActivePage("pending")}
              >
                Pending Requests
              </button>
              <button
                className={activePage === "employees" ? "active" : ""}
                onClick={() => setActivePage("employees")}
              >
                Employee History
              </button>
            </>
          ) : (
            <>
              <button
                className={activePage === "apply" ? "active" : ""}
                onClick={() => setActivePage("apply")}
              >
                Apply Leave
              </button>
              <button
                className={activePage === "history" ? "active" : ""}
                onClick={() => setActivePage("history")}
              >
                Leave History
              </button>
            </>
          )}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{role}</p>
            <h2>{pageTitle(activePage, isManager)}</h2>
          </div>
          <div className="topbar-actions">
            <span className="user-pill">{role === "manager" ? "Manager" : "Employee"}</span>
            <button className="secondary-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {notice ? <div className="toast">{notice}</div> : null}

        {isManager ? (
          <ManagerView
            token={token}
            activePage={activePage}
            setNotice={setNotice}
            onUnauthorized={handleUnauthorized}
          />
        ) : (
          <EmployeeView
            token={token}
            activePage={activePage}
            setActivePage={setActivePage}
            setNotice={setNotice}
            onUnauthorized={handleUnauthorized}
          />
        )}
      </main>
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
      <section className="login-shell">
        <div className="login-intro">
          <div className="login-intro-top">
            <div className="brand-mark">LM</div>
            <div>
              <p className="eyebrow">DareX AI</p>
              <h1>Leave Management</h1>
            </div>
            <p className="login-copy">
              Track leave requests, approvals, and team history from one clean
              workspace.
            </p>
          </div>
          <div className="login-stats">
            <span>Employee self-service</span>
            <strong>Manager approvals</strong>
            <span>Live request history</span>
          </div>
        </div>
        <form className="login-panel" onSubmit={submit}>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in</h2>
            <p className="form-helper">Choose a demo account or enter credentials.</p>
          </div>
          <div className="demo-switcher" aria-label="Demo credentials">
            <button type="button" onClick={() => useDemoCredentials("employee")}>
              Employee Demo
            </button>
            <button type="button" onClick={() => useDemoCredentials("manager")}>
              Manager Demo
            </button>
          </div>
          {notice ? <div className="toast">{notice}</div> : null}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
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
        setNotice={setNotice}
        onUnauthorized={onUnauthorized}
      />
    );
  }
  return <EmployeeDashboard token={token} onUnauthorized={onUnauthorized} />;
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

function MetricGrid({ metrics }) {
  return (
    <section className="metric-grid">
      {metrics.map((metric) => (
        <article className="metric-card" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </article>
      ))}
    </section>
  );
}

function StatusBadge({ status }) {
  return <span className={`status ${status?.toLowerCase()}`}>{status}</span>;
}

function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}

function LoadingState() {
  return <div className="loading-state">Loading...</div>;
}

function EmployeeDashboard({ token, onUnauthorized }) {
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

  if (loading) return <LoadingState />;
  if (error) return <EmptyState>{error}</EmptyState>;
  if (!dashboard) return <EmptyState>No dashboard data found.</EmptyState>;

  return (
    <div className="content-stack">
      <MetricGrid
        metrics={[
          { label: "Total Leaves", value: dashboard.total },
          { label: "Pending", value: dashboard.pending },
          { label: "Approved", value: dashboard.approved },
          { label: "Rejected", value: dashboard.rejected },
        ]}
      />
      <RecentLeaves title="Recent Leave Requests" leaves={dashboard.recent} />
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

  if (loading) return <LoadingState />;
  if (error) return <EmptyState>{error}</EmptyState>;
  if (!dashboard) return <EmptyState>No dashboard data found.</EmptyState>;

  return (
    <div className="content-stack">
      <MetricGrid
        metrics={[
          { label: "Total Employees", value: dashboard.totalEmployees },
          { label: "Pending Requests", value: dashboard.pending },
          { label: "Approved", value: dashboard.approved },
          { label: "Rejected", value: dashboard.rejected },
        ]}
      />
      <RecentLeaves title="Recent Activity" leaves={dashboard.recent} showEmployee />
    </div>
  );
}

function RecentLeaves({ title, leaves, showEmployee = false }) {
  return (
    <section className="section-panel">
      <h3>{title}</h3>
      {leaves?.length ? (
        <div className="activity-list">
          {leaves.map((leave) => (
            <div className="activity-row" key={leave.id}>
              <div>
                {showEmployee ? <strong>{leave.employee?.name || "Employee"}</strong> : null}
                <span>{leave.leaveType}</span>
              </div>
              <StatusBadge status={leave.status} />
              <time>{formatDate(leave.createdAt)}</time>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>No leave requests found.</EmptyState>
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
      setNotice("Leave request submitted.");
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

  return (
    <form className="form-panel" onSubmit={submit}>
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
      <label>
        Reason
        <textarea
          value={form.reason}
          onChange={(event) => updateField("reason", event.target.value)}
          rows={5}
          required
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" disabled={loading}>
        {loading ? "Submitting..." : "Submit Leave"}
      </button>
    </form>
  );
}

function LeaveHistory({ token, setNotice, onUnauthorized }) {
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
      setNotice(normalizeError(requestError));
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
      setNotice("Leave request cancelled.");
      load();
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(error));
    }
  }

  async function saveEdit(form) {
    try {
      await api.put(`/leaves/${editing.id}`, form);
      setNotice("Leave request updated.");
      setEditing(null);
      load();
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(error));
    }
  }

  return (
    <div className="content-stack">
      <div className="toolbar">
        <input
          placeholder="Search leave type or reason"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All</option>
          {statuses.map((statusValue) => (
            <option key={statusValue} value={statusValue}>
              {statusValue}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">All Types</option>
          {leaveTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <LeaveTable leaves={leaves} onEdit={setEditing} onDelete={deleteLeave} />
      )}
      {editing ? (
        <EditLeaveDialog leave={editing} onCancel={() => setEditing(null)} onSave={saveEdit} />
      ) : null}
    </div>
  );
}

function LeaveTable({ leaves, onEdit, onDelete }) {
  if (!leaves.length) return <EmptyState>No leave requests found.</EmptyState>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id}>
              <td>{leave.leaveType}</td>
              <td>{formatDate(leave.startDate)}</td>
              <td>{formatDate(leave.endDate)}</td>
              <td>
                <StatusBadge status={leave.status} />
              </td>
              <td className="actions-cell">
                {leave.status === "Pending" ? (
                  <>
                    <button onClick={() => onEdit(leave)}>Edit</button>
                    <button onClick={() => onDelete(leave)}>Delete</button>
                  </>
                ) : (
                  <span>View</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
        <h3>Edit Leave</h3>
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
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button">Save</button>
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
      setNotice(normalizeError(requestError));
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
      setNotice("Leave approved.");
      setSelectedLeave(null);
      load();
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(error));
    }
  }

  async function reject(leave) {
    if (!comment.trim()) {
      setNotice("Comment is required.");
      return;
    }
    try {
      await api.put(`/manager/reject/${leave.id}`, { comment });
      setNotice("Leave rejected.");
      setComment("");
      setSelectedLeave(null);
      load();
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setNotice(normalizeError(error));
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="content-stack">
      {leaves.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.employee?.name || "Employee"}</td>
                  <td>{leave.leaveType}</td>
                  <td>
                    {formatDate(leave.startDate)}-{formatDate(leave.endDate)}
                  </td>
                  <td>{leave.reason}</td>
                  <td>
                    <StatusBadge status={leave.status} />
                  </td>
                  <td>
                    <button onClick={() => setSelectedLeave(leave)}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No pending leave requests found.</EmptyState>
      )}

      {selectedLeave ? (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h3>{selectedLeave.employee?.name || "Employee"}</h3>
            <dl className="detail-list">
              <div>
                <dt>Department</dt>
                <dd>{selectedLeave.employee?.department || "-"}</dd>
              </div>
              <div>
                <dt>Leave Type</dt>
                <dd>{selectedLeave.leaveType}</dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>
                  {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}
                </dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{selectedLeave.reason}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{selectedLeave.status}</dd>
              </div>
            </dl>
            <label>
              Rejection Comment
              <textarea
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setSelectedLeave(null)}>
                Close
              </button>
              <button className="danger-button" onClick={() => reject(selectedLeave)}>
                Reject
              </button>
              <button className="primary-button" onClick={() => approve(selectedLeave)}>
                Approve
              </button>
            </div>
          </div>
        </div>
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
      setNotice(normalizeError(requestError));
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
      setNotice(normalizeError(requestError));
    }
  }

  return (
    <div className="content-stack">
      <div className="toolbar">
        <input
          placeholder="Name"
          value={filters.name}
          onChange={(event) => setFilters({ ...filters, name: event.target.value })}
        />
        <input
          placeholder="Email"
          value={filters.email}
          onChange={(event) => setFilters({ ...filters, email: event.target.value })}
        />
        <input
          placeholder="Department"
          value={filters.department}
          onChange={(event) =>
            setFilters({ ...filters, department: event.target.value })
          }
        />
        <button className="primary-button" onClick={search}>
          Search
        </button>
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.department}</td>
                  <td>
                    <button onClick={() => loadHistory(employee)}>View History</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {history ? (
        <section className="section-panel">
          <h3>{history.employee.name}</h3>
          {history.leaves.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Leave</th>
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
                      <td>
                        {formatDate(leave.startDate)}-{formatDate(leave.endDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No leave requests found.</EmptyState>
          )}
        </section>
      ) : null}
    </div>
  );
}
