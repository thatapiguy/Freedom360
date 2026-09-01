"use client";

import { useState } from "react";
import type { Household, LifeEvent } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { LIFE_EVENT_CATEGORIES } from "@/lib/lifeEventCategories";
import { LifeEventModal } from "@/components/forms/LifeEventModal";
import { formatCurrency } from "@/lib/format";

function describeTiming(event: LifeEvent): string {
  if (event.timing.mode === "oneTime") {
    return `Age ${event.timing.age} · ${formatCurrency(event.amount)}`;
  }
  return `Ages ${event.timing.startAge}–${event.timing.endAge} · ${formatCurrency(event.amount)}/yr`;
}

function LifeEventList({
  events,
  accentColor,
  onRemove,
}: {
  events: LifeEvent[];
  accentColor: string;
  onRemove: (id: string) => void;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        None yet.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {events.map((event) => {
        const meta = LIFE_EVENT_CATEGORIES[event.category];
        return (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
            style={{ background: "var(--surface-2)" }}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
              style={{ background: accentColor }}
            >
              {meta.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{event.name}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {describeTiming(event)}
                {event.owner === "spouse" ? " · Spouse" : ""}
              </div>
            </div>
            <button
              onClick={() => onRemove(event.id)}
              className="text-xs shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function LifeEventsForm({
  household,
  setHousehold,
}: {
  household: Household;
  setHousehold: (updater: (h: Household) => Household) => void;
}) {
  const [modalKind, setModalKind] = useState<"expense" | "income" | null>(null);

  const addEvent = (event: LifeEvent) =>
    setHousehold((h) => ({ ...h, lifeEvents: [...h.lifeEvents, event] }));

  const removeEvent = (id: string) =>
    setHousehold((h) => ({ ...h, lifeEvents: h.lifeEvents.filter((e) => e.id !== id) }));

  const spendingGoals = household.lifeEvents.filter((e) => e.kind === "expense");
  const incomeEvents = household.lifeEvents.filter((e) => e.kind === "income");

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <Card
        title="Spending goals"
        subtitle="A wedding, a home purchase, years of tuition — expenses tied to a specific stage of life, before or after retirement."
      >
        <LifeEventList events={spendingGoals} accentColor="var(--series-2)" onRemove={removeEvent} />
        <button
          onClick={() => setModalKind("expense")}
          className="mt-4 rounded-lg border border-dashed px-4 py-2 text-sm font-medium w-full"
          style={{ color: "var(--text-secondary)" }}
        >
          + Add spending goal
        </button>
      </Card>

      <Card
        title="Income events"
        subtitle="An inheritance, selling a property, a few years of part-time work — income tied to a specific stage of life."
      >
        <LifeEventList events={incomeEvents} accentColor="var(--series-3)" onRemove={removeEvent} />
        <button
          onClick={() => setModalKind("income")}
          className="mt-4 rounded-lg border border-dashed px-4 py-2 text-sm font-medium w-full"
          style={{ color: "var(--text-secondary)" }}
        >
          + Add income event
        </button>
      </Card>

      {modalKind && (
        <LifeEventModal
          kind={modalKind}
          household={household}
          onClose={() => setModalKind(null)}
          onSave={addEvent}
        />
      )}
    </div>
  );
}
