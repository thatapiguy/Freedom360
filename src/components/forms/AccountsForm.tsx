"use client";

import type { Account, AccountType, Household, Owner } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { NumberField, PercentField, SelectField, TextField } from "@/components/ui/fields";
import { generateId } from "@/lib/id";
import { formatCurrency } from "@/lib/format";

const TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "taxable", label: "Taxable brokerage" },
  { value: "traditional", label: "Traditional (401k/IRA)" },
  { value: "roth", label: "Roth (401k/IRA)" },
  { value: "hsa", label: "HSA" },
];

const OWNER_OPTIONS: { value: Owner; label: string }[] = [
  { value: "primary", label: "You" },
  { value: "spouse", label: "Spouse" },
  { value: "joint", label: "Joint" },
];

export function AccountsForm({
  household,
  setHousehold,
}: {
  household: Household;
  setHousehold: (updater: (h: Household) => Household) => void;
}) {
  const update = (id: string, patch: Partial<Account>) =>
    setHousehold((h) => ({
      ...h,
      accounts: h.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));

  const remove = (id: string) =>
    setHousehold((h) => ({ ...h, accounts: h.accounts.filter((a) => a.id !== id) }));

  const add = () =>
    setHousehold((h) => ({
      ...h,
      accounts: [
        ...h.accounts,
        {
          id: generateId(),
          name: "New account",
          type: "taxable",
          owner: "primary",
          balance: 0,
          annualContribution: 0,
          employerMatch: 0,
          expectedReturn: 0.05,
          returnStdDev: 0.14,
        },
      ],
    }));

  const total = household.accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <Card
      title="Accounts"
      subtitle="Everything you're investing for retirement — enter balances yourself, nothing links to a real bank."
      action={
        <div className="text-sm font-medium tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {formatCurrency(total)} total
        </div>
      }
    >
      <div className="space-y-4">
        {household.accounts.map((account) => (
          <div key={account.id} className="rounded-xl border p-4" style={{ background: "var(--surface-2)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <TextField
                  value={account.name}
                  onCommit={(name) => update(account.id, { name })}
                />
              </div>
              <button
                onClick={() => remove(account.id)}
                className="text-xs shrink-0 mt-2"
                style={{ color: "var(--text-muted)" }}
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SelectField
                label="Type"
                value={account.type}
                options={TYPE_OPTIONS}
                onChange={(type) => update(account.id, { type })}
              />
              <SelectField
                label="Owner"
                value={account.owner}
                options={OWNER_OPTIONS}
                onChange={(owner) => update(account.id, { owner })}
              />
              <NumberField
                label="Balance"
                value={account.balance}
                min={0}
                step={1000}
                onCommit={(balance) => update(account.id, { balance })}
              />
              <NumberField
                label="Annual contribution"
                value={account.annualContribution}
                min={0}
                step={500}
                onCommit={(annualContribution) => update(account.id, { annualContribution })}
              />
              <NumberField
                label="Employer match"
                value={account.employerMatch}
                min={0}
                step={500}
                onCommit={(employerMatch) => update(account.id, { employerMatch })}
              />
              <PercentField
                label="Expected return"
                hint="Above inflation"
                value={account.expectedReturn}
                min={-5}
                max={15}
                onCommit={(expectedReturn) => update(account.id, { expectedReturn })}
              />
              <PercentField
                label="Return volatility"
                hint="Std. deviation"
                value={account.returnStdDev}
                min={0}
                max={40}
                onCommit={(returnStdDev) => update(account.id, { returnStdDev })}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-4 rounded-lg border border-dashed px-4 py-2 text-sm font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        + Add account
      </button>
    </Card>
  );
}
