import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${className}`}
      style={{ background: "var(--surface-1)" }}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="font-semibold text-base">{title}</h2>}
            {subtitle && (
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
