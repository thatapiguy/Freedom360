"use client";

import { useRef, useState } from "react";
import { usePlannerStore } from "@/lib/store";
import { Card } from "@/components/ui/Card";

export function DataManagement() {
  const exportData = usePlannerStore((s) => s.exportData);
  const importData = usePlannerStore((s) => s.importData);
  const resetAll = usePlannerStore((s) => s.resetAll);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freedom360-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const result = importData(text);
    setMessage(result.ok ? "Imported successfully." : (result.error ?? "Import failed."));
  };

  return (
    <Card
      title="Your data"
      subtitle="Everything you enter is stored only in this browser (localStorage) — nothing is sent anywhere. Export a backup or move your plan to another device."
    >
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{ background: "var(--surface-2)" }}
        >
          Export backup (.json)
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{ background: "var(--surface-2)" }}
        >
          Import backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => {
            if (confirm("Reset all scenarios back to the starter example? This can't be undone.")) {
              resetAll();
              setMessage("Reset to defaults.");
            }
          }}
          className="rounded-lg border px-4 py-2 text-sm font-medium ml-auto"
          style={{ color: "var(--status-critical)" }}
        >
          Reset all data
        </button>
      </div>
      {message && (
        <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>
      )}
    </Card>
  );
}
