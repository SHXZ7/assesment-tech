export default function StatusBadge({ status }) {
  const key = status?.toLowerCase() || "pending";
  const label =
    key === "cancelled"
      ? "Cancelled"
      : status
        ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        : "Pending";

  return (
    <span className={`status-badge ${key}`}>
      <span className="dot" aria-hidden="true" />
      {label}
    </span>
  );
}
