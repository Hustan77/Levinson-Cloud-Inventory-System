import React from "react";
import { HoloPanel } from "./HoloPanel";

/* LANDMARK: KPI Tiles */
export function KpiTile({
  label,
  value,
  accent = "cyan"
}: {
  label: string;
  value: number | string;
  accent?: "cyan" | "emerald" | "amber" | "purple";
}) {
  const accentRing =
    accent === "cyan" ? "ring-cyan-300" :
    accent === "emerald" ? "ring-emerald-400" :
    accent === "amber" ? "ring-amber-300" :
    "ring-purple-400";

  return (
    <HoloPanel rail={false} className={`ring-1 ${accentRing} ring-opacity-30`}>
      <div className="kpi-number">{value}</div>
      <div className="kpi-label">{label}</div>
    </HoloPanel>
  );
}
