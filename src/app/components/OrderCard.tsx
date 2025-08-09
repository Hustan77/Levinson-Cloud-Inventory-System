"use client";

/**
 * LANDMARK: OrderCard — icons only
 * - Left icon now means "Edit Order" (calls onEdit)
 * - Right icon still "Mark delivered"
 * - No Refresh button
 */

import React from "react";
import { HoloPanel } from "./HoloPanel";
import type { Casket, Supplier, Urn, VOrderEnriched } from "@/lib/types";
import { StatusPill } from "./StatusPill";

const IconTruck = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M3 7h11v7h7v3h-1a2 2 0 1 1-4 0H8a2 2 0 1 1-4 0H3V7zm11 2v2h4l-2-2h-2z" fill="currentColor"/>
  </svg>
);
const IconEditOrder = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M4 4h7l2 2h7v14H4V4zm9 8H7v2h6v-2zm4-4H7v2h10V8z" fill="currentColor"/>
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
  order, suppliers, caskets, urns, onMarkDelivered, onEdit,
}: {
  order: VOrderEnriched;
  suppliers: Supplier[];
  caskets: Casket[];
  urns: Urn[];
  onMarkDelivered?: (o: VOrderEnriched) => void;
  onEdit?: (o: VOrderEnriched) => void;
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

  return (
    <HoloPanel railColor={rail} className="relative min-h-[176px] flex flex-col">
      {/* LANDMARK: Header */}
      <div className="flex items-start justify-between">
        <StatusPill
          status={order.status}
          backordered={order.backordered}
          tbd={order.tbd_expected}
          expectedDate={order.expected_date ?? null}
          kind="order"
        />
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

      {/* LANDMARK: Bottom actions bar — icons only */}
      <div className="mt-auto pt-3 flex items-center justify-end gap-2 border-t border-white/10 relative z-10 pointer-events-auto">
        <IconBtn title="Edit Order" onClick={() => onEdit?.(order)}>
          <IconEditOrder className="text-white/80" />
        </IconBtn>
        <IconBtn title="Mark delivered" onClick={() => onMarkDelivered?.(order)}>
          <IconTruck className="text-emerald-300" />
        </IconBtn>
      </div>
    </HoloPanel>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode; }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
    >
      {children}
    </button>
  );
}
