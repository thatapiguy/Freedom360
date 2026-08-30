"use client";

import { useActiveHousehold } from "@/lib/hooks";
import { PeopleForm } from "@/components/forms/PeopleForm";
import { AccountsForm } from "@/components/forms/AccountsForm";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { OneTimeForm } from "@/components/forms/OneTimeForm";
import { AssumptionsForm } from "@/components/forms/AssumptionsForm";
import { DataManagement } from "@/components/forms/DataManagement";

export default function ProfilePage() {
  const [household, setHousehold] = useActiveHousehold();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your plan</h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          Everything below feeds the projections on your dashboard. Changes save
          automatically.
        </p>
      </div>
      <PeopleForm household={household} setHousehold={setHousehold} />
      <AccountsForm household={household} setHousehold={setHousehold} />
      <IncomeForm household={household} setHousehold={setHousehold} />
      <OneTimeForm household={household} setHousehold={setHousehold} />
      <AssumptionsForm household={household} setHousehold={setHousehold} />
      <DataManagement />
    </div>
  );
}
