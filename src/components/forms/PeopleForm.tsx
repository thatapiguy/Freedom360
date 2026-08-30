"use client";

import type { Household } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { NumberField, TextField } from "@/components/ui/fields";

export function PeopleForm({
  household,
  setHousehold,
}: {
  household: Household;
  setHousehold: (updater: (h: Household) => Household) => void;
}) {
  const addSpouse = () =>
    setHousehold((h) => ({
      ...h,
      spouse: { name: "Spouse", currentAge: 35, retirementAge: 65, lifeExpectancy: 95 },
    }));
  const removeSpouse = () =>
    setHousehold((h) => {
      const { spouse: _spouse, ...rest } = h;
      void _spouse;
      return rest as Household;
    });

  return (
    <Card title="About you" subtitle="Ages drive when income starts, when you retire, and how long the plan needs to last.">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            You
          </div>
          <TextField
            label="Name"
            value={household.primary.name}
            onCommit={(name) =>
              setHousehold((h) => ({ ...h, primary: { ...h.primary, name } }))
            }
          />
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="Current age"
              value={household.primary.currentAge}
              min={18}
              max={100}
              onCommit={(currentAge) =>
                setHousehold((h) => ({ ...h, primary: { ...h.primary, currentAge } }))
              }
            />
            <NumberField
              label="Retirement age"
              value={household.primary.retirementAge}
              min={household.primary.currentAge}
              max={100}
              onCommit={(retirementAge) =>
                setHousehold((h) => ({
                  ...h,
                  primary: { ...h.primary, retirementAge },
                }))
              }
            />
            <NumberField
              label="Plan to age"
              value={household.primary.lifeExpectancy}
              min={household.primary.retirementAge}
              max={110}
              onCommit={(lifeExpectancy) =>
                setHousehold((h) => ({
                  ...h,
                  primary: { ...h.primary, lifeExpectancy },
                }))
              }
            />
          </div>
        </div>

        {household.spouse ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                Spouse / partner
              </div>
              <button
                onClick={removeSpouse}
                className="text-xs underline"
                style={{ color: "var(--text-muted)" }}
              >
                Remove
              </button>
            </div>
            <TextField
              label="Name"
              value={household.spouse.name}
              onCommit={(name) =>
                setHousehold((h) => ({
                  ...h,
                  spouse: h.spouse ? { ...h.spouse, name } : h.spouse,
                }))
              }
            />
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="Current age"
                value={household.spouse.currentAge}
                min={18}
                max={100}
                onCommit={(currentAge) =>
                  setHousehold((h) => ({
                    ...h,
                    spouse: h.spouse ? { ...h.spouse, currentAge } : h.spouse,
                  }))
                }
              />
              <NumberField
                label="Retirement age"
                value={household.spouse.retirementAge}
                min={household.spouse.currentAge}
                max={100}
                onCommit={(retirementAge) =>
                  setHousehold((h) => ({
                    ...h,
                    spouse: h.spouse ? { ...h.spouse, retirementAge } : h.spouse,
                  }))
                }
              />
              <NumberField
                label="Plan to age"
                value={household.spouse.lifeExpectancy}
                min={household.spouse.retirementAge}
                max={110}
                onCommit={(lifeExpectancy) =>
                  setHousehold((h) => ({
                    ...h,
                    spouse: h.spouse ? { ...h.spouse, lifeExpectancy } : h.spouse,
                  }))
                }
              />
            </div>
          </div>
        ) : (
          <button
            onClick={addSpouse}
            className="self-start rounded-lg border border-dashed px-4 py-3 text-sm font-medium h-fit"
            style={{ color: "var(--text-secondary)" }}
          >
            + Add spouse / partner
          </button>
        )}
      </div>
    </Card>
  );
}
