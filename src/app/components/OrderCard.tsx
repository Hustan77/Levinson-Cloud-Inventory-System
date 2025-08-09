"use client";

/**
 * LANDMARK: OrderCard — compact, non-overlapping icon actions
 * - Subtle icon row top-right, content has right padding to avoid overlap
 * - Color rail matches status: PENDING(amber) | BACKORDERED(rose) | SPECIAL(purple) | ARRIVED(emerald)
 */

import React from "react";
import { HoloPanel } from "./HoloPanel";
import type { Casket, Supplier, Urn, VOrderEnriched } from "../../lib/types";
import { Button } from "./ui/button";

// Tiny inline SVG icons (no extra deps)
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

function StatusRailColor(status: VOrderEnriched["status"]) {
  switch (status) {
    case "BACKORDERED": return "rose";
    case "SPECIAL": return "purple";
    case "ARRIVED": return "emerald";
    default: return "amber";
  }
}

function IconButton({
  label, onClick, children, ariaLabel,
}: { label: string; onClick: () => void; children: React.ReactNode; ariaLabel?: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 shadow transition ease-[cubic-bezier(.2,.8,.2,1)] duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
    >
      {children}
    </button>
  );
}

export function OrderCard({
  order,
  suppliers,
  caskets,
  urns,
  onRefresh,
  onMarkDelivered,
  onDetails,
}: {
  order: VOrderEnriched;
  suppliers: Supplier[];
  caskets: Casket[];
  urns: Urn[];
  onRefresh: () => void;
  /** Optional: open Arrival modal directly */
  onMarkDelivered?: (o: VOrderEnriched) => void;
  /** Optional: open details modal */
  onDetails?: (o: VOrderEnriched) => void;
}) {
  const rail = StatusRailColor(order.status);
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

  const badgeText =
    order.status === "BACKORDERED"
      ? (order.tbd_expected ? "Backordered (TBD)" : "Backordered")
      : order.status === "SPECIAL"
      ? "Special"
      : order.status === "ARRIVED"
      ? "Arrived"
      : "Pending";

  const badgeClass =
    order.status === "BACKORDERED"
      ? "text-rose-300"
      : order.status === "SPECIAL"
      ? "text-fuchsia-300"
      : order.status === "ARRIVED"
      ? "text-emerald-300"
      : "text-amber-300";

  return (
    <HoloPanel railColor={rail} className="relative min-h-[160px]">
      {/* LANDMARK: Icon strip — absolutely positioned, content gets pr-16 */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <IconButton
          label="Mark delivered"
          ariaLabel={`Mark delivered for ${itemLabel}`}
          onClick={() => onMarkDelivered?.(order)}
        >
          <IconTruck className="text-emerald-300" />
        </IconButton>
        <IconButton
          label="Details"
          ariaLabel={`Details for ${itemLabel}`}
          onClick={() => onDetails?.(order)}
        >
          <IconInfo className="text-white/80" />
        </IconButton>
      </div>

      {/* LANDMARK: Main content with right padding to avoid icon overlap */}
      <div className="pr-16">
        <div className="flex items-start gap-3">
          <div className={`text-xs ${badgeClass}`}>{badgeText}</div>
          <div className="text-xs text-white/50">PO #{order.po_number}</div>
        </div>

        <div className="mt-1 text-white/90">{itemLabel}</div>
        <div className="text-xs text-white/60 mt-0.5">Supplier: {supplierName}</div>

        {/* Dates & flags */}
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
          {order.expected_date && !order.backordered && (
            <div>Expected: {order.expected_date}</div>
          )}
          {order.special_order && order.deceased_name && (
            <div>Deceased: {order.deceased_name}</div>
          )}
          {order.need_by_date && <div>Need by: {order.need_by_date}</div>}
          {order.notes && <div className="text-white/50 italic">{order.notes}</div>}
        </div>

        {/* LANDMARK: Foot actions (optional refresh) */}
        <div className="mt-3">
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </div>
    </HoloPanel>
  );
}
