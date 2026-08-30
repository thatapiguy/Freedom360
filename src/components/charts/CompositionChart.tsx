"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AccountType, ProjectionResult } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const TYPE_COLOR: Record<AccountType, string> = {
  taxable: "var(--series-1)",
  traditional: "var(--series-2)",
  roth: "var(--series-3)",
  hsa: "var(--series-4)",
};

const TYPE_LABEL: Record<AccountType, string> = {
  taxable: "Taxable",
  traditional: "Traditional",
  roth: "Roth",
  hsa: "HSA",
};

const ALL_TYPES: AccountType[] = ["taxable", "traditional", "roth", "hsa"];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{ background: "var(--surface-1)" }}>
      <div className="font-medium mb-1">Age {label}</div>
      {payload
        .filter((p) => p.value > 0)
        .map((p) => (
          <div key={p.dataKey} className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: p.color }} />
            {TYPE_LABEL[p.dataKey as AccountType]}:{" "}
            <span className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(p.value, { compact: true })}
            </span>
          </div>
        ))}
      <div className="mt-1 pt-1 border-t font-medium tabular-nums">{formatCurrency(total, { compact: true })}</div>
    </div>
  );
}

export function CompositionChart({
  projection,
  retirementAge,
}: {
  projection: ProjectionResult;
  retirementAge: number;
}) {
  const usedTypes = ALL_TYPES.filter((t) =>
    projection.years.some((y) => y.accounts.some((a) => a.type === t && a.endBalance > 0))
  );
  const data = projection.years.map((y) => {
    const row: Record<string, number> = { age: y.primaryAge };
    for (const type of usedTypes) {
      row[type] = y.accounts.filter((a) => a.type === type).reduce((s, a) => s + a.endBalance, 0);
    }
    return row;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
        {usedTypes.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: TYPE_COLOR[t] }} />
            {TYPE_LABEL[t]}
          </span>
        ))}
      </div>
      <div className="h-64 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--gridline)" vertical={false} />
            <XAxis
              dataKey="age"
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--baseline)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              x={retirementAge}
              stroke="var(--baseline)"
              strokeDasharray="3 3"
              label={{ value: "Retirement", position: "top", fill: "var(--text-muted)", fontSize: 11 }}
            />
            {usedTypes.map((t) => (
              <Area
                key={t}
                dataKey={t}
                stackId="net-worth"
                stroke="none"
                fill={TYPE_COLOR[t]}
                fillOpacity={0.85}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
