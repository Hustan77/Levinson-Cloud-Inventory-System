"use client";

/**
 * LANDMARK: StatusPill — prominent, urgent when zero on-hand/backordered
 */

import React from "react";

export function StatusPill({
  status, backordered, tbd, urgency = "low",
}: {
  status: "PENDING" | "BACKORDERED" | "ARRIVED" | "SPECIAL";
  backordered?: boolean;
  tbd?: boolean;
  urgency?: "low" | "med" | "high";
}) {
  const label =
    status === "BACKORDERED" ? (tbd ? "Backordered (TBD)" : "Backordered")
    : status === "SPECIAL" ? "Special"
    : status === "ARRIVED" ? "Arrived"
    : "Pending";

  const glow =
    urgency === "high" ? "shadow-[0_0_24px_rgba(244,63,94,0.45)]"
    : urgency === "med" ? "shadow-[0_0_18px_rgba(251,191,36,0.35)]"
    : "shadow-[0_0_12px_rgba(34,197,94,0.25)]";

  const color =
    status === "BACKORDERED" ? "text-rose-300 border-rose-400/40"
    : status === "SPECIAL" ? "text-fuchsia-300 border-fuchsia-400/40"
    : status === "ARRIVED" ? "text-emerald-300 border-emerald-400/40"
    : "text-amber-300 border-amber-400/40";

  return (
    <span className={`inline-flex items-center px-2 h-6 rounded-md border bg-white/5 text-xs ${color} ${glow}`}>
      {label}
    </span>
  );
}
