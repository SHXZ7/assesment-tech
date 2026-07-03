export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <div className="content-stack">
      <div className="skeleton-grid">
        <SkeletonBlock className="skeleton-card" />
        <SkeletonBlock className="skeleton-card" />
        <SkeletonBlock className="skeleton-card" />
        <SkeletonBlock className="skeleton-card" />
      </div>
      <SkeletonBlock className="skeleton-table" />
    </div>
  );
}

export function TableSkeleton() {
  return <SkeletonBlock className="skeleton-table" />;
}

export function FormSkeleton() {
  return <SkeletonBlock className="skeleton-form" />;
}
