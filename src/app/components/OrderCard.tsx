"use client";

/**
 * LANDMARK: OrderCard (resilient supplier name + Notes chip)
 * - Supplier name resolution:
 *    1) v_orders_enriched.supplier_name (if present)
 *    2) Lookup by supplier_id from props.suppliers (handles string/number id)
 *    3) Fallback "—"
 * - Notes chip shows in-card panel if order.notes exists.
 * - Edit opens UpdateOrderModal; Delivered triggers parent ArrivalModal.
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
const IconCheckCircle = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-1.2 12.2 5-5a1 1 0 1 1 1.4 1.4l-5.7 5.7a1 1 0 0 1-1.4 0l-2.3-2.3a1 1 0 1 1 1.4-1.4l1.6 1.6z" fill="currentColor"/>
  </svg>
);
const IconNote = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...p}>
    <path fill="currentColor" d="M4 3h12l4 4v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm12 0v4h4" />
  </svg>
);

type Props = {
  order: VOrderEnriched;
  suppliers: Supplier[];
  caskets: Casket[];
  urns: Urn[];
  onMarkDelivered?: (o: VOrderEnriched) => void;
  onEdit?: (o: VOrderEnriched) => void; // reserved, we open inline modal here
};

function statusColor(status: VOrderEnriched["status"]) {
  switch (status) {
    case "PENDING": return "amber";
    case "BACKORDERED": return "rose";
    case "SPECIAL": return "purple";
    case "ARRIVED": return "emerald";
    default: return "cyan";
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
  const [showNotes, setShowNotes] = useState(false);

  // LANDMARK: robust supplier name resolution
  const supplierName = useMemo(() => {
    // 1) Use enriched view column if present
    const fromView = (order as any).supplier_name;
    if (fromView && String(fromView).trim().length > 0) return String(fromView);

    // 2) Lookup by supplier_id (handle string/number)
    const supId =
      typeof order.supplier_id === "string"
        ? parseInt(order.supplier_id, 10)
        : order.supplier_id ?? null;
    if (supId != null && !Number.isNaN(supId)) {
      const sup = suppliers.find((s) => s.id === supId);
      if (sup?.name) return sup.name;
    }

    // 3) Fallback
    return "—";
  }, [order, suppliers]);

  // LANDMARK: resolve item display name robustly
  const itemName = useMemo(() => {
    let name = order.item_display || order.item_name || "";
    if (!name && order.item_id) {
      if (order.item_type === "casket") {
        name = caskets.find((x) => x.id === order.item_id)?.name || name;
      } else if (order.item_type === "urn") {
        name = urns.find((x) => x.id === order.item_id)?.name || name;
      }
    }
    if (!name) name = `${order.item_type === "urn" ? "Urn" : "Casket"}${order.item_id ? ` #${order.item_id}` : ""}`;
    return name;
  }, [order, caskets, urns]);

  const hasNotes = !!(order.notes && order.notes.trim().length > 0);

  return (
    <>
      <HoloPanel rail railColor={rail} className="flex flex-col pb-12 relative">
        {/* LANDMARK: Header */}
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
            <span className="text-white/80">{supplierName}</span>
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

          {/* LANDMARK: Notes chip (order-only) */}
          {hasNotes && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowNotes((v) => !v)}
                className={`inline-flex items-center gap-2 h-7 px-2.5 rounded-md border text-[11px] ${
                  showNotes
                    ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                    : "border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
                } focus:outline-none focus:ring-2 focus:ring-cyan-400/60`}
                title="Show order notes"
              >
                <IconNote className="opacity-80" />
                Notes
              </button>
            </div>
          )}
        </div>

        {/* LANDMARK: In-card notes panel */}
        {hasNotes && showNotes && (
          <div className="mt-2 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="px-3 py-2 text-[11px] text-white/60 flex items-center justify-between">
              <span>Order Notes</span>
              <button
                type="button"
                className="h-6 px-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
                onClick={() => setShowNotes(false)}
                aria-label="Close notes"
              >
                Close
              </button>
            </div>
            <div className="max-h-32 overflow-auto px-3 pb-3">
              <div className="text-xs text-white/80 whitespace-pre-wrap">
                {order.notes}
              </div>
            </div>
          </div>
        )}

        {/* LANDMARK: Action row (bottom) */}
        <div className="mt-auto pt-3 border-t border-white/10 grid grid-cols-2 gap-2 absolute left-3 right-3 bottom-3">
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
          // Parent page reloads data after PATCH (Dashboard does this).
        }}
      />
    </>
  );
}
