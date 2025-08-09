"use client";

/**
 * LANDMARK: OrderCard — bottom action bar (icons no longer overlap text)
 * - Urgency colors via StatusPill
 * - Actions row at bottom: Mark Delivered, Details
 */

import React from "react";
import { HoloPanel } from "./HoloPanel";
import type { Casket, Supplier, Urn, VOrderEnriched } from "../../lib/types";
import { Button } from "./ui/button";
import { StatusPill } from "./StatusPill";

// Icons (no extra deps)
const IconTruck = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M3 7h11v7h7v3h-1a2 2 0 1 1-4 0H8a2 2 0 1 1-4 0H3V7zm11 2v2h4l-2-2h-2z" fill="currentColor"/>
  </svg>
);
const IconInfo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
  </svg>
);

function railFor(status: VOrderEnriched["status"]) {
  switch (status) {
    case "BACKORDERED": return "rose";
    case "SPECIAL": return "purple";
    case "ARRIVED": return "emerald";
    default: return "amber";
  }
}

export function OrderCard({
  order, suppliers, caskets, urns, onRefresh, onMarkDelivered, onDetails,
}: {
  order: VOrderEnriched;
  suppliers: Supplier[];
  caskets: Casket[];
  urns: Urn[];
  onRefresh: () => void;
  onMarkDelivered?: (o: VOrderEnriched) => void;
  onDetails?: (o: VOrderEnriched) => void;
}) {
  const rail = railFor(order.status);
  const supplierName =
    order.supplier_name ??
    suppliers.find((s) => s.id === order.supplier_id)?.name ??
    "—";

  const itemLabel = (() => {
    if (order.item_type === "casket") {
      if (order.item_id) {
        const c = caskets.find((x) => x.id === order.item_id);
        return c?.name ?? order.item_name ?? "Casket";
      }
      return order.item_name ?? "Casket (custom)";
    } else {
      if (order.item_id) {
        const u = urns.find((x) => x.id === order.item_id);
        return u?.name ?? order.item_name ?? "Urn";
      }
      return order.item_name ?? "Urn (custom)";
    }
  })();

  const urgency: "low"|"med"|"high" = order.status === "BACKORDERED"
    ? "high"
    : order.expected_date
      ? "med"
      : "low";

  return (
    <HoloPanel railColor={rail} className="relative min-h-[170px] flex flex-col">
      {/* LANDMARK: Header */}
      <div className="flex items-start justify-between">
        <StatusPill status={order.status} backordered={order.backordered} tbd={order.tbd_expected} urgency={urgency} />
        <div className="text-xs text-white/50">PO #{order.po_number}</div>
      </div>

      {/* LANDMARK: Content */}
      <div className="mt-1">
        <div className="text-white/90">{itemLabel}</div>
        <div className="text-xs text-white/60 mt-0.5">Supplier: {supplierName}</div>
        <div className="mt-2 text-xs text-white/60 space-y-0.5">
          {order.backordered && (
            <div>
              Backordered:{" "}
              {order.tbd_expected ? (
                <span className="text-rose-300">TBD</span>
              ) : order.expected_date ? (
                <span className="text-rose-300">{order.expected_date}</span>
              ) : (
                <span className="text-rose-300">—</span>
              )}
            </div>
          )}
          {!order.backordered && order.expected_date && <div>Expected: {order.expected_date}</div>}
          {order.special_order && order.deceased_name && <div>Deceased: {order.deceased_name}</div>}
          {order.need_by_date && <div>Need by: {order.need_by_date}</div>}
          {order.notes && <div className="text-white/50 italic">{order.notes}</div>}
        </div>
      </div>

      {/* LANDMARK: Bottom actions bar (no overlap with text) */}
      <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/10">
        <Button variant="outline" onClick={onRefresh}>Refresh</Button>
        <div className="flex gap-2">
          <button
            type="button" title="Details" aria-label="Details"
            onClick={() => onDetails?.(order)}
            className="inline-flex h-8 px-2 items-center gap-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
          >
            <IconInfo className="text-white/80" /> Details
          </button>
          <button
            type="button" title="Mark delivered" aria-label="Mark delivered"
            onClick={() => onMarkDelivered?.(order)}
            className="inline-flex h-8 px-2 items-center gap-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
          >
            <IconTruck className="text-emerald-300" /> Delivered
          </button>
        </div>
      </div>
    </HoloPanel>
  );
}
