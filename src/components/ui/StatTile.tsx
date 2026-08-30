export function StatTile({
  label,
  value,
  hint,
  status,
}: {
  label: string;
  value: string;
  hint?: string;
  status?: "good" | "warning" | "critical";
}) {
  const statusColor =
    status === "good"
      ? "var(--status-good)"
      : status === "warning"
        ? "var(--status-warning)"
        : status === "critical"
          ? "var(--status-critical)"
          : undefined;
  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--surface-2)" }}>
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div
        className="text-2xl font-semibold mt-1 tabular-nums"
        style={{ color: statusColor ?? "var(--text-primary)" }}
      >
        {value}
      </div>
      {hint && (
        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}
