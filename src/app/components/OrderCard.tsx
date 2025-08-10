"use client";

import React from "react";
import { HoloPanel } from "./HoloPanel";
import type { Supplier, Casket, Urn, VOrderEnriched } from "@/lib/types";

const IconEdit = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
    <path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
  </svg>
);
const IconBox = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path d="M21 8l-9-5-9 5 9 5 9-5zm-9 7l-9-5v6l9 5 9-5v-6l-9 5z" fill="currentColor" />
  </svg>
);

type Props = {
  order: VOrderEnriched;
  suppliers: Supplier[];
  caskets: Casket[];
  urns: Urn[];
  onMarkDelivered?: (o: VOrderEnriched) => void;
  onEdit?: (o: VOrderEnriched) => void;
};

export default function OrderCard({
  order,
  suppliers,
  caskets,
  urns,
  onMarkDelivered,
  onEdit,
}: Props) {
  // Supplier resolution: view -> API fallback -> local list -> "—"
  const supplierName =
    order.supplier_name ??
    (order.supplier_id
      ? suppliers.find((s) => s.id === order.supplier_id)?.name ?? null
      : null) ??
    "—";

  // Item display name: view/API field; otherwise resolve from lists
  const itemName =
    order.item_display_name ??
    (order.status === "SPECIAL"
      ? order.item_name ?? "Special Order"
      : order.item_type === "casket"
      ? (order.item_id && caskets.find((c) => c.id === order.item_id)?.name) || "Casket"
      : (order.item_id && urns.find((u) => u.id === order.item_id)?.name) || "Urn");

  const rail =
    order.status === "ARRIVED"
      ? "emerald"
      : order.status === "SPECIAL"
      ? "purple"
      : order.backordered
      ? "rose"
      : "amber";

  return (
    <HoloPanel railColor={rail} className="min-h-[170px] pb-10 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="text-white/90 truncate">{itemName}</div>
        <span
          className={[
            "inline-flex items-center px-2 h-6 rounded-md border text-xs",
            order.status === "ARRIVED"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
              : order.status === "SPECIAL"
              ? "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300"
              : order.backordered
              ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
              : "border-amber-400/30 bg-amber-500/10 text-amber-300",
          ].join(" ")}
        >
          {order.status}
        </span>
      </div>

      <div className="text-xs text-white/60 mt-1">Supplier: {supplierName}</div>
      <div className="text-xs text-white/60">
        PO#: {order.po_number}{" "}
        {order.expected_date
          ? `• Expected: ${order.expected_date}`
          : order.tbd_expected
          ? "• Expected: TBD"
          : ""}
      </div>

      <div className="mt-auto pt-3 flex items-center justify-end gap-2 border-t border-white/10">
        <button
          type="button"
          title="Edit order"
          aria-label="Edit order"
          onClick={() => onEdit?.(order)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
        >
          <IconEdit className="text-white/80" />
        </button>
        <button
          type="button"
          title="Mark delivered"
          aria-label="Mark delivered"
          onClick={() => onMarkDelivered?.(order)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
        >
          <IconBox className="text-emerald-300" />
        </button>
      </div>
    </HoloPanel>
  );
}
