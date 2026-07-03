export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="empty-state">
      {Icon ? <Icon size={48} strokeWidth={1.25} /> : null}
      {title ? <p className="empty-state-title">{title}</p> : null}
      {subtitle ? <p className="empty-state-subtitle">{subtitle}</p> : null}
      {action}
    </div>
  );
}
