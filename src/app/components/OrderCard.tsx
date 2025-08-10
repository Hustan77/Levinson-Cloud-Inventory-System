"use client";

/**
 * LANDMARK: OrderCard
 * - Always shows an item name (robust fallback chain)
 * - Action icons row (bottom). New "Mark Delivered" icon = check-circle.
 * - "Edit" opens UpdateOrderModal (controllable).
 */

import React, { useMemo, useState } from "react";
import { HoloPanel } from "./HoloPanel";
import UpdateOrderModal from "./UpdateOrderModal";
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
// New, clearer mark-delivered icon
const IconCheckCircle = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-1.2 12.2 5-5a1 1 0 1 1 1.4 1.4l-5.7 5.7a1 1 0 0 1-1.4 0l-2.3-2.3a1 1 0 1 1 1.4-1.4l1.6 1.6z" fill="currentColor"/>
  </svg>
);

type Props = {
  order: VOrderEnriched;
  suppliers: Supplier[];
  caskets: Casket[];
  urns: Urn[];
  onMarkDelivered?: (o: VOrderEnriched) => void;
  onEdit?: (o: VOrderEnriched) => void; // kept for future hooks; we open inline modal now
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
}: Props) {
  const rail = statusColor(order.status);
  const [editOpen, setEditOpen] = useState(false);

  // Resolve friendly item name with aggressive fallback
  const supplier = suppliers.find((s) => s.id === order.supplier_id) || null;

  const itemName = useMemo(() => {
    // primary: enriched / explicit
    let name = order.item_display || order.item_name || "";

    // fallback: look up by type/id
    if (!name && order.item_id) {
      if (order.item_type === "casket") {
        const c = caskets.find((x) => x.id === order.item_id);
        if (c?.name) name = c.name;
      } else if (order.item_type === "urn") {
        const u = urns.find((x) => x.id === order.item_id);
        if (u?.name) name = u.name;
      }
    }

    // final fallback
    if (!name) {
      name = `${order.item_type === "urn" ? "Urn" : "Casket"}${order.item_id ? ` #${order.item_id}` : ""}`;
    }
    return name;
  }, [order, caskets, urns]);

  return (
    <>
      <HoloPanel rail railColor={rail} className="flex flex-col pb-10">
        {/* LANDMARK: Header row */}
        <div className="flex items-center gap-2 pr-1">
          <IconBox className="text-white/70" />
          <div className="text-white/90 text-sm truncate">{itemName}</div>
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
          <div className="truncate">
            <span className="text-white/50">PO#:</span>{" "}
            <span className="text-white/90">{order.po_number}</span>
          </div>
          <div className="truncate">
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
            <div className="text-white/60 whitespace-pre-wrap line-clamp-3">
              <span className="text-white/50">Notes:</span> {order.notes}
            </div>
          )}
        </div>

        {/* LANDMARK: Action row (bottom, no overlap with text) */}
        <div className="mt-auto pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
          <button
            type="button"
            title="Edit order"
            aria-label="Edit order"
            onClick={() => setEditOpen(true)}
            className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          >
            <IconEdit className="text-white/80" />
            <span className="text-xs text-white/80">Edit</span>
          </button>

          {order.status !== "ARRIVED" && (
            <button
              type="button"
              title="Mark delivered"
              aria-label="Mark delivered"
              onClick={() => onMarkDelivered?.(order)}
              className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <IconCheckCircle className="text-emerald-300" />
              <span className="text-xs text-white/80">Delivered</span>
            </button>
          )}
        </div>
      </HoloPanel>

      {/* LANDMARK: Inline Update Modal */}
      <UpdateOrderModal
        open={editOpen}
        onOpenChange={setEditOpen}
        order={order}
        onUpdated={() => {
          setEditOpen(false);
          // The parent page reloads data after PATCH (it calls onCompleted or onCreated).
          // If you want this card to refresh itself, lift state up (already done in page.tsx).
        }}
      />
    </>
  );
}
