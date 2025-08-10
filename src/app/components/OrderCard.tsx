"use client";

/**
 * OrderCard
 * - Supplier resolves via:
 *   1) order.supplier_name (from v_orders_enriched or join)
 *   2) suppliers.find by numeric equality on id vs supplier_id
 *   3) order.supplier (string from older views)
 * - Icons in a dedicated footer row (no overlap with text)
 * - Subtle "due today / overdue" ring on the info slab
 */

import React from "react";
import { HoloPanel } from "./HoloPanel";
import type { Casket, Supplier, Urn, VOrderEnriched } from "@/lib/types";
import { Pencil, PackageCheck } from "lucide-react";

export default function OrderCard({
  order,
  suppliers,
  caskets,
  urns,
  onMarkDelivered,
  onEdit,
}: {
  order: VOrderEnriched;
  suppliers: Supplier[];
  caskets: Casket[];
  urns: Urn[];
  onMarkDelivered?: (o: VOrderEnriched) => void;
  onEdit?: (o: VOrderEnriched) => void;
}) {
  const status = order.status; // PENDING | BACKORDERED | SPECIAL | ARRIVED
  const rail =
    status === "ARRIVED" ? "emerald" : status === "SPECIAL" ? "purple" : status === "BACKORDERED" ? "rose" : "amber";

  // LANDMARK: robust supplier + item name resolution (coerce id types)
  const supplierName =
    (order as any).supplier_name ??
    suppliers.find((s) => Number(s.id) === Number(order.supplier_id))?.name ??
    (order as any).supplier ??
    "—";

  const itemName =
    order.item_name ||
    (order.item_type === "casket"
      ? caskets.find((c) => Number(c.id) === Number(order.item_id))?.name
      : urns.find((u) => Number(u.id) === Number(order.item_id))?.name) ||
    "(unnamed item)";

  // Due today / overdue highlight
  let dueRing = "";
  if (order.expected_date && status !== "ARRIVED" && !order.tbd_expected) {
    const today = new Date();
    const d = new Date(order.expected_date);
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const dueMid = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (dueMid <= todayMid) dueRing = "ring-1 ring-amber-400/60";
  }

  return (
    <HoloPanel rail railColor={rail} className="flex flex-col gap-3 p-4">
      {/* LANDMARK: header */}
      <div className="flex items-start gap-2">
        <div className="text-white/90 text-sm leading-5 truncate">{itemName}</div>
        <div className="ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-white/70">
          {status}
        </div>
      </div>

      {/* LANDMARK: body */}
      <div className={`rounded-lg border border-white/10 bg-white/5 p-2 text-xs ${dueRing}`}>
        <div className="text-white/70">
          <span className="text-white/50">Supplier:</span>{" "}
          <span className="text-white/80">{supplierName}</span>
        </div>
        <div className="text-white/70">
          <span className="text-white/50">PO#:</span> <span className="text-white/80">{order.po_number}</span>
        </div>
        {order.tbd_expected ? (
          <div className="text-white/70">
            <span className="text-white/50">Expected:</span> <span className="text-white/80">TBD</span>
          </div>
        ) : (
          order.expected_date && (
            <div className="text-white/70">
              <span className="text-white/50">Expected:</span>{" "}
              <span className="text-white/80">{new Date(order.expected_date).toLocaleDateString()}</span>
            </div>
          )
        )}
        {order.backordered && <div className="text-rose-300/90">Backordered</div>}
        {(order as any).notes && (
          <div className="text-white/60 mt-1 line-clamp-3">{(order as any).notes}</div>
        )}
      </div>

      {/* LANDMARK: footer actions */}
      <div className="mt-1 pt-2 border-t border-white/10 flex items-center justify-end gap-2">
        {onEdit && (
          <button
            aria-label="Edit order"
            className="p-2 rounded-md border border-white/10 hover:bg-white/10 text-white/80"
            onClick={() => onEdit(order)}
          >
            <Pencil size={16} />
          </button>
        )}
        {onMarkDelivered && (
          <button
            aria-label="Mark delivered"
            className="p-2 rounded-md border border-white/10 hover:bg-white/10 text-white/80"
            onClick={() => onMarkDelivered(order)}
          >
            <PackageCheck size={16} />
          </button>
        )}
      </div>
    </HoloPanel>
  );
}
