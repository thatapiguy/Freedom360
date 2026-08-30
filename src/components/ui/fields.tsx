"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2";
const inputStyle = { background: "var(--surface-2)" } as const;

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
      {hint && (
        <span className="block text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export function NumberField({
  value,
  onCommit,
  label,
  hint,
  step,
  min,
  max,
  suffix,
}: {
  value: number;
  onCommit: (value: number) => void;
  label?: string;
  hint?: string;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const [text, setText] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setText(String(value));
  }

  const commit = () => {
    const parsed = Number(text);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed));
      onCommit(clamped);
      setText(String(clamped));
    } else {
      setText(String(value));
    }
  };

  const input = (
    <div className="relative">
      <input
        type="number"
        value={text}
        step={step}
        min={min}
        max={max}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className={inputClass}
        style={inputStyle}
      />
      {suffix && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
          style={{ color: "var(--text-muted)" }}
        >
          {suffix}
        </span>
      )}
    </div>
  );

  if (!label) return input;
  return (
    <Field label={label} hint={hint}>
      {input}
    </Field>
  );
}

/** For rate-like values stored as decimals (0.05) but edited as percentages (5). */
export function PercentField({
  value,
  onCommit,
  label,
  hint,
  step = 0.1,
  min = -20,
  max = 20,
}: {
  value: number;
  onCommit: (value: number) => void;
  label?: string;
  hint?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <NumberField
      value={Number((value * 100).toFixed(3))}
      onCommit={(pct) => onCommit(pct / 100)}
      label={label}
      hint={hint}
      step={step}
      min={min}
      max={max}
      suffix="%"
    />
  );
}

export function TextField({
  value,
  onCommit,
  label,
  hint,
  placeholder,
}: {
  value: string;
  onCommit: (value: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setText(value);
  }

  const input = (
    <input
      type="text"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onCommit(text)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={inputClass}
      style={inputStyle}
    />
  );
  if (!label) return input;
  return (
    <Field label={label} hint={hint}>
      {input}
    </Field>
  );
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
  label,
  hint,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label?: string;
  hint?: string;
}) {
  const select = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={inputClass}
      style={inputStyle}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  if (!label) return select;
  return (
    <Field label={label} hint={hint}>
      {select}
    </Field>
  );
}
