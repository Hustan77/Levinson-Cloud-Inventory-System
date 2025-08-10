"use client";

/**
 * OrderCard — compact footer actions (icons), no overlap with text.
 * - Footer sticks to bottom of card content
 * - Icons only (no large buttons)
 * - Leaves content area clean
 */

import React from "react";
import { HoloPanel } from "./HoloPanel";
import type { Casket, Supplier, Urn, VOrderEnriched } from "@/lib/types";
import { Pencil, PackageCheck, Info } from "lucide-react";

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
  const status = order.status; // PENDING|BACKORDERED|SPECIAL|ARRIVED
  const rail =
    status === "ARRIVED" ? "emerald" : status === "SPECIAL" ? "purple" : status === "BACKORDERED" ? "rose" : "amber";

  const supplier = suppliers.find((s) => s.id === order.supplier_id) || null;
  const itemName =
    order.item_type === "casket"
      ? caskets.find((c) => c.id === order.item_id)?.name ?? order.item_name ?? ""
      : urns.find((u) => u.id === order.item_id)?.name ?? order.item_name ?? "";

  // simple due flag (today/overdue)
  let dueClass = "";
  if (order.expected_date && status !== "ARRIVED") {
    const today = new Date();
    const d = new Date(order.expected_date);
    if (d <= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      dueClass = "ring-1 ring-amber-400/60";
    }
  }

  return (
    <HoloPanel rail railColor={rail} className="flex flex-col gap-3 p-4">
      {/* content */}
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <div className="text-white/90 text-sm truncate">{itemName || "(unnamed item)"}</div>
          <div className="ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-white/70">
            {status}
          </div>
        </div>

        <div className={`rounded-lg border border-white/10 bg-white/5 p-2 text-xs ${dueClass}`}>
          <div className="text-white/70">
            <span className="text-white/50">Supplier:</span> <span className="text-white/80">{supplier?.name ?? "—"}</span>
          </div>
          <div className="text-white/70">
            <span className="text-white/50">PO#:</span> <span className="text-white/80">{order.po_number}</span>
          </div>
          {order.expected_date && (
            <div className="text-white/70">
              <span className="text-white/50">Expected:</span>{" "}
              <span className="text-white/80">{new Date(order.expected_date).toLocaleDateString()}</span>
            </div>
          )}
          {order.backordered && (
            <div className="text-rose-300/90">Backordered{order.tbd_expected ? " • TBD" : ""}</div>
          )}
        </div>
      </div>

      {/* footer actions */}
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
        <span className="ml-2 text-white/40 text-[11px] flex items-center gap-1">
          <Info size={14} /> actions
        </span>
      </div>
    </HoloPanel>
  );
}
