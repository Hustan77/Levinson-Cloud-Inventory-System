"use client";

/**
 * LANDMARK: OrderCard (no deceased_name usage)
 * - Neon rail color based on status
 * - Clean action icons row at bottom (no overlap with text)
 * - Props include optional onMarkDelivered / onEdit
 */

import React from "react";
import { HoloPanel } from "./HoloPanel";
import type { VOrderEnriched, Supplier, Casket, Urn } from "@/lib/types";

const IconBox = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" fill="currentColor" />
  </svg>
);
const IconEdit = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
    <path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
  </svg>
);
const IconTruck = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path d="M3 7h11v7h-1.5a2.5 2.5 0 1 0 0 1H16a2 2 0 0 0 2-2V9h2l2 3v5h-1a2.5 2.5 0 1 0 0 1H19a2 2 0 0 1-2-2v-1H9.5a2.5 2.5 0 1 0 0-1H8V7z" fill="currentColor" />
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

function statusColor(status: VOrderEnriched["status"]) {
  switch (status) {
    case "PENDING":
      return "amber";
    case "BACKORDERED":
      return "rose";
    case "SPECIAL":
      return "purple";
    case "ARRIVED":
      return "emerald";
    default:
      return "cyan";
  }
}

export default function OrderCard({
  order,
  suppliers,
  caskets,
  urns,
  onMarkDelivered,
  onEdit,
}: Props) {
  const rail = statusColor(order.status);

  // Resolve friendly item name and supplier
  const supplier = suppliers.find((s) => s.id === order.supplier_id) || null;

  let itemName: string = order.item_display || order.item_name || "—";
  if (!itemName && order.item_id && order.item_type === "casket") {
    const c = caskets.find((x) => x.id === order.item_id);
    if (c) itemName = c.name;
  }
  if (!itemName && order.item_id && order.item_type === "urn") {
    const u = urns.find((x) => x.id === order.item_id);
    if (u) itemName = u.name;
  }

  return (
    <HoloPanel rail railColor={rail} className="flex flex-col pb-10">
      {/* LANDMARK: Header row */}
      <div className="flex items-center gap-2">
        <IconBox className="text-white/70" />
        <div className="text-white/90 text-sm">{itemName}</div>
        <div
          className={`ml-auto text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${
            order.status === "PENDING"
              ? "border-amber-400/50 text-amber-300/90"
              : order.status === "BACKORDERED"
              ? "border-rose-400/50 text-rose-300/90"
              : order.status === "SPECIAL"
              ? "border-fuchsia-400/50 text-fuchsia-300/90"
              : "border-emerald-400/50 text-emerald-300/90"
          }`}
        >
          {order.status}
        </div>
      </div>

      {/* LANDMARK: Body */}
      <div className="mt-2 space-y-1 text-xs text-white/70">
        <div>
          <span className="text-white/50">PO#:</span>{" "}
          <span className="text-white/90">{order.po_number}</span>
        </div>
        <div>
          <span className="text-white/50">Supplier:</span>{" "}
          <span className="text-white/80">{supplier?.name ?? "—"}</span>
        </div>
        <div className="flex flex-wrap gap-x-4">
          <div>
            <span className="text-white/50">Expected:</span>{" "}
            <span className="text-white/80">
              {order.tbd_expected ? "TBD" : order.expected_date ?? "—"}
            </span>
          </div>
          <div>
            <span className="text-white/50">Backordered:</span>{" "}
            <span className="text-white/80">{order.backordered ? "Yes" : "No"}</span>
          </div>
        </div>
        {order.notes && (
          <div className="text-white/60 whitespace-pre-wrap">
            <span className="text-white/50">Notes:</span> {order.notes}
          </div>
        )}
      </div>

      {/* LANDMARK: Action row (bottom, non-overlapping) */}
      <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-end gap-2">
        <IconBtn
          title="Edit order"
          onClick={() => onEdit?.(order)}
          ariaLabel="Edit order"
        >
          <IconEdit className="text-white/80" />
        </IconBtn>
        {order.status !== "ARRIVED" && (
          <IconBtn
            title="Mark delivered"
            onClick={() => onMarkDelivered?.(order)}
            ariaLabel="Mark delivered"
          >
            <IconTruck className="text-emerald-300" />
          </IconBtn>
        )}
      </div>
    </HoloPanel>
  );
}

function IconBtn({
  title,
  ariaLabel,
  onClick,
  children,
}: {
  title: string;
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
    >
      {children}
    </button>
  );
}
