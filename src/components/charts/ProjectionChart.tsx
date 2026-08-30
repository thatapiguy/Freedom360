"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonteCarloResult, ProjectionResult } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface ChartRow {
  age: number;
  p10: number;
  p10to25: number;
  p25to75: number;
  p75to90: number;
  p50: number;
  p90Raw: number;
  p10Raw: number;
  p25Raw: number;
  p75Raw: number;
}

function buildData(mc: MonteCarloResult): ChartRow[] {
  return mc.bands.map((b) => ({
    age: b.age,
    p10: b.p10,
    p10to25: Math.max(0, b.p25 - b.p10),
    p25to75: Math.max(0, b.p75 - b.p25),
    p75to90: Math.max(0, b.p90 - b.p75),
    p50: b.p50,
    p90Raw: b.p90,
    p10Raw: b.p10,
    p25Raw: b.p25,
    p75Raw: b.p75,
  }));
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{ background: "var(--surface-1)" }}
    >
      <div className="font-medium mb-1">Age {label}</div>
      <div style={{ color: "var(--text-secondary)" }}>
        Median: <span className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(row.p50, { compact: true })}</span>
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        25th–75th: <span className="tabular-nums">{formatCurrency(row.p25Raw, { compact: true })} – {formatCurrency(row.p75Raw, { compact: true })}</span>
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        10th–90th: <span className="tabular-nums">{formatCurrency(row.p10Raw, { compact: true })} – {formatCurrency(row.p90Raw, { compact: true })}</span>
      </div>
    </div>
  );
}

export function ProjectionChart({
  monteCarlo,
  deterministic,
  retirementAge,
}: {
  monteCarlo: MonteCarloResult;
  deterministic: ProjectionResult;
  retirementAge: number;
}) {
  const data = buildData(monteCarlo);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
        <LegendSwatch color="var(--series-1)" label="Median outcome" line />
        <LegendSwatch color="var(--seq-300)" label="25th–75th percentile" />
        <LegendSwatch color="var(--seq-100)" label="10th–90th percentile" />
      </div>
      <div className="h-72 sm:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--gridline)" vertical={false} />
            <XAxis
              dataKey="age"
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--baseline)" }}
              tickLine={false}
              label={{ value: "Age", position: "insideBottom", offset: -4, fill: "var(--text-muted)", fontSize: 12 }}
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
            <ReferenceLine y={0} stroke="var(--baseline)" />
            <Area dataKey="p10" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area
              dataKey="p10to25"
              stackId="band"
              stroke="none"
              fill="var(--seq-100)"
              isAnimationActive={false}
            />
            <Area
              dataKey="p25to75"
              stackId="band"
              stroke="none"
              fill="var(--seq-300)"
              fillOpacity={0.9}
              isAnimationActive={false}
            />
            <Area
              dataKey="p75to90"
              stackId="band"
              stroke="none"
              fill="var(--seq-100)"
              isAnimationActive={false}
            />
            <Line
              dataKey="p50"
              stroke="var(--series-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
        Based on {monteCarlo.runs.toLocaleString()} simulated market paths. Ending balance in{" "}
        {deterministic.finalBalance > 0 ? "today's dollars" : "today's dollars (this plan ran out of money)"}.
      </p>
    </div>
  );
}

function LegendSwatch({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block rounded-sm"
        style={{
          width: 12,
          height: line ? 2 : 10,
          background: color,
        }}
      />
      {label}
    </span>
  );
}
