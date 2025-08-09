"use client";

/**
 * LANDMARK: StatusPill
 * - For orders: only shows urgency glow when expected date is today or late.
 * - For inventory uses: consume kind="inventory" to render strong urgency styles externally.
 */

import React from "react";

type OrderStatus = "PENDING" | "BACKORDERED" | "ARRIVED" | "SPECIAL";

export function StatusPill({
  status,
  backordered,
  tbd,
  expectedDate,   // ISO yyyy-mm-dd for order urgency check
  kind = "order",
}: {
  status: OrderStatus;
  backordered?: boolean;
  tbd?: boolean;
  expectedDate?: string | null;
  kind?: "order" | "inventory"; // inventory badges are handled separately in cards; this stays "order" by default
}) {
  const label =
    status === "BACKORDERED" ? (tbd ? "Backordered (TBD)" : "Backordered")
    : status === "SPECIAL" ? "Special"
    : status === "ARRIVED" ? "Arrived"
    : "Pending";

  // Only apply urgency glow for orders when expected date is today or past.
  let urgent = false;
  if (kind === "order" && expectedDate && !tbd) {
    try {
      const today = new Date();
      const d = new Date(expectedDate + "T00:00:00");
      const t = new Date(today.toISOString().slice(0,10) + "T00:00:00");
      urgent = d <= t; // due today or late
    } catch {
      urgent = false;
    }
  }

  const baseGlow =
    status === "BACKORDERED" ? "shadow-[0_0_12px_rgba(244,63,94,0.35)]"
    : status === "SPECIAL" ? "shadow-[0_0_12px_rgba(217,70,239,0.35)]"
    : status === "ARRIVED" ? "shadow-[0_0_12px_rgba(16,185,129,0.25)]"
    : "shadow-[0_0_12px_rgba(251,191,36,0.25)]";

  const urgentGlow = urgent
    ? "shadow-[0_0_22px_rgba(244,63,94,0.55)] ring-1 ring-rose-400/50"
    : "";

  const color =
    status === "BACKORDERED" ? "text-rose-300 border-rose-400/40"
    : status === "SPECIAL" ? "text-fuchsia-300 border-fuchsia-400/40"
    : status === "ARRIVED" ? "text-emerald-300 border-emerald-400/40"
    : "text-amber-300 border-amber-400/40";

  return (
    <span
      className={`inline-flex items-center px-2 h-6 rounded-md border bg-white/5 text-xs ${color} ${baseGlow} ${urgentGlow}`}
    >
      {label}
    </span>
  );
}
